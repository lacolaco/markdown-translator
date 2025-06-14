import * as fs from 'fs/promises';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Translator, type TranslationInput } from './translator';
import {
  Proofreader,
  type ProofreadInput,
  type ProofreadResult,
} from './proofreader';
import { DebugLogger } from './debug-logger';
import { chunkMarkdown, getChunkStats } from './semantic-chunker';
import { validateLineCount } from './line-count-validator';
import { joinChunks } from './chunk-utils';
import type { TranslationOptions } from './types';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';

export class TranslationWorkflow {
  private translator: Translator;
  private proofreader: Proofreader;
  private debugLogger: DebugLogger;

  private constructor(translator: Translator, proofreader: Proofreader) {
    this.debugLogger = new DebugLogger();
    this.translator = translator;
    this.proofreader = proofreader;
  }

  /**
   * Creates a new TranslationWorkflow instance with dynamically loaded prompts
   * @param options - Translation options
   * @param translatorLLM - Optional translator LLM instance
   * @param proofreaderLLM - Optional proofreader LLM instance
   * @returns Promise resolving to TranslationWorkflow instance
   */
  static async create(
    _options: TranslationOptions = {},
    translatorLLM?: BaseLanguageModel,
    proofreaderLLM?: BaseLanguageModel
  ): Promise<TranslationWorkflow> {
    // Translator用LLMインスタンスを生成（翻訳に適した設定）
    const finalTranslatorLLM =
      translatorLLM ||
      new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: 'gemini-2.0-flash',
        temperature: 0.3, // 翻訳では適度な創造性を許可
      });

    // Proofreader用LLMインスタンスを生成（校正に適した設定）
    const finalProofreaderLLM =
      proofreaderLLM ||
      new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: 'gemini-2.0-flash',
        temperature: 0.1, // 校正では一貫性を重視
      });

    // プロンプトを読み込んでインスタンスを作成
    const debugLogger = new DebugLogger();
    const translator = await Translator.create(finalTranslatorLLM, debugLogger);
    const proofreader = await Proofreader.create(finalProofreaderLLM);

    return new TranslationWorkflow(translator, proofreader);
  }

  async translateMarkdownFile(
    inputPath: string,
    options: TranslationOptions = {}
  ): Promise<string> {
    const maxRetries = options.maxRetries || 3;
    const outputPath = options.outputPath;

    console.log(`翻訳開始: ${inputPath}`);

    // デバッグロガーの初期化
    await this.debugLogger.initialize();

    // ファイル読み込み
    const originalContent = await this.readFile(inputPath);
    await this.debugLogger.logOriginalContent(originalContent);

    const originalLines = originalContent.split('\n');
    console.log(`ファイルサイズ: ${originalContent.length} 文字`);
    console.log(`総行数: ${originalLines.length} 行`);

    // 1. セマンティックチャンクに分割
    console.log('📝 セマンティックチャンクベース翻訳+校正を開始...');
    const chunks = await chunkMarkdown(originalContent);
    const stats = getChunkStats(chunks);

    console.log(`📊 チャンク統計:`);
    console.log(`  総チャンク数: ${stats.totalChunks}`);

    // チャンク情報をログ出力
    await this.debugLogger.logSemanticChunks(chunks);

    // 2. 各チャンクを順次処理（翻訳→校正）
    const processedChunks: string[] = [];
    const previousTranslations: string[] = [];

    for (const [index, chunk] of chunks.entries()) {
      const chunkNumber = index + 1;
      console.log(
        `📝 チャンク ${chunkNumber}/${chunks.length} を処理中... (${chunk.content.length}文字)`
      );

      try {
        // 翻訳
        console.log(`  🔄 翻訳中...`);
        await this.debugLogger.logChunkInput(index, chunk.content);

        const translatedChunk = await this.translator.run({
          text: chunk.content,
          previousTranslations,
          maxRetries,
        } satisfies TranslationInput);

        // 翻訳の行数チェック結果をログ出力
        const translationValidation = validateLineCount(
          chunk.content,
          translatedChunk
        );
        if (!translationValidation.isValid) {
          console.warn(
            `  ⚠️ 翻訳後の行数が一致しません (元: ${chunk.content.split('\n').length}, 翻訳後: ${translatedChunk.split('\n').length})`
          );
        } else {
          console.log(
            `  ✅ 翻訳完了: 行数一致 (${chunk.content.split('\n').length} 行)`
          );
        }

        // 校正
        console.log(`  🔍 校正中...`);
        const proofreadResult = await this.proofreader.run({
          text: translatedChunk,
          maxRetries,
        } satisfies ProofreadInput);

        // 校正結果とエラーログ出力
        if (proofreadResult.error) {
          console.warn(`  ⚠️ 校正後も残ったエラー:`);
          console.warn(`${proofreadResult.error}`);
        } else {
          console.log(`  ✅ 校正完了`);
        }

        await this.debugLogger.logChunkOutput(index, proofreadResult.text);

        processedChunks.push(proofreadResult.text);
        previousTranslations.push(proofreadResult.text);

        console.log(`  ✅ チャンク ${chunkNumber} 完了`);
      } catch (error) {
        console.error(`  ❌ チャンク ${chunkNumber} でエラー:`, error);
        // エラーの場合は元のチャンクを使用
        processedChunks.push(chunk.content);
        previousTranslations.push(chunk.content);
      }
    }

    // 3. チャンクを結合
    console.log('\n🔗 チャンクを結合中...');
    const finalContent = joinChunks(processedChunks);

    // 4. 最終的な行数チェック
    const finalValidation = validateLineCount(originalContent, finalContent);
    if (!finalValidation.isValid) {
      console.error(
        '❌ 最終結果の行数が一致しません。チャンク境界の問題の可能性があります。'
      );
    } else {
      console.log('✅ 最終結果の行数が一致しています。');
    }

    // 最終結果をデバッグ出力
    await this.debugLogger.logFinalResult(finalValidation.adjustedText);

    // ファイルに保存
    if (outputPath) {
      await fs.writeFile(outputPath, finalValidation.adjustedText, 'utf-8');
      console.log(`\n✅ 翻訳完了: ${outputPath}`);
      console.log(
        `最終確認: ${finalValidation.adjustedText.split('\n').length} 行 (元: ${originalLines.length} 行)`
      );
    }

    return finalValidation.adjustedText;
  }

  async debugChunks(inputPath: string): Promise<void> {
    console.log(`チャンク分割デバッグ: ${inputPath}`);

    const content = await this.readFile(inputPath);

    // チャンク分割の実行
    const chunks = await chunkMarkdown(content);
    const stats = getChunkStats(chunks);

    console.log(`\n📊 チャンク統計:`);
    console.log(`  総チャンク数: ${stats.totalChunks}`);
    console.log(`  平均文字数: ${stats.averageSize}`);
    console.log(`  最大チャンク: ${stats.maxSize} 文字`);

    console.log(`\n📝 各チャンクの詳細:`);
    chunks.forEach((chunk, index) => {
      console.log(
        `\n--- チャンク ${index + 1} (${chunk.content.length} 文字) ---`
      );
      console.log(
        chunk.content.substring(0, 200) +
          (chunk.content.length > 200 ? '...' : '')
      );
    });
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`ファイル読み込みエラー: ${error}`);
    }
  }
}
