import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { Agent } from './agent';
import { joinChunks } from './chunk-utils';
import { DebugLogger } from './debug-logger';
import { validateLineCount } from './line-count-validator';
import { Proofreader, type ProofreadInput } from './proofreader';
import { chunkMarkdown, getChunkStats } from './semantic-chunker';
import { Translator, type TranslationInput } from './translator';
import type { TranslationOptions } from './types';

// TranslationWorkflow Agent types
export interface TranslationWorkflowInput {
  content: string;
  options: TranslationOptions;
}

export interface TranslationWorkflowOutput {
  translatedContent: string;
  originalLineCount: number;
  translatedLineCount: number;
  isValid: boolean;
}

export class TranslationWorkflow
  implements Agent<TranslationWorkflowInput, TranslationWorkflowOutput>
{
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
  static async create(googleApiKey: string): Promise<TranslationWorkflow> {
    // Translator用LLMインスタンスを生成（翻訳に適した設定）
    const translatorLLM = new ChatGoogleGenerativeAI({
      apiKey: googleApiKey,
      model: 'gemini-2.5-flash-preview-05-20',
      temperature: 0.5, // 翻訳の一貫性を重視
    });

    // Proofreader用LLMインスタンスを生成（校正に適した設定）
    const proofreaderLLM = new ChatGoogleGenerativeAI({
      apiKey: googleApiKey,
      model: 'gemini-2.5-flash-preview-05-20',
      temperature: 0.8, // エラー修正への柔軟性を持たせる
      cache: false,
    });

    // プロンプトを読み込んでインスタンスを作成
    const translator = await Translator.create(translatorLLM);
    const proofreader = await Proofreader.create(proofreaderLLM);

    return new TranslationWorkflow(translator, proofreader);
  }

  async run(
    input: TranslationWorkflowInput
  ): Promise<TranslationWorkflowOutput> {
    const { content, options } = input;
    return this.translateMarkdownContent(content, options);
  }

  private async translateMarkdownContent(
    originalContent: string,
    options: TranslationOptions
  ): Promise<TranslationWorkflowOutput> {
    const maxRetries = options.maxRetries || 3;

    console.log('翻訳開始');

    // デバッグロガーの初期化
    await this.debugLogger.initialize();
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

    // 2. 各チャンクを順次処理（翻訳→校正）
    const processedChunks: string[] = [];
    const previousTranslations: string[] = [];

    for (const [index, chunk] of chunks.entries()) {
      const chunkNumber = index + 1;
      console.log(
        `📝 チャンク ${chunkNumber}/${chunks.length} を処理中... (${chunk.content.length}文字)`
      );

      try {
        // 入力のデバッグ出力
        await this.debugLogger.logChunkInput(index, chunk.content);

        // 翻訳
        console.log(`  🔄 翻訳中...`);
        const translatedChunk = await this.translator.run({
          text: chunk.content,
          maxRetries,
        } satisfies TranslationInput);

        // 翻訳結果のデバッグ出力
        await this.debugLogger.logChunkTranslated(index, translatedChunk);

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

        // 最終結果のデバッグ出力
        await this.debugLogger.logChunkOutput(index, proofreadResult.text);

        processedChunks.push(proofreadResult.text);
        previousTranslations.push(proofreadResult.text);

        console.log(`  ✅ チャンク ${chunkNumber} 完了`);
      } catch (error) {
        console.error(`  ❌ チャンク ${chunkNumber} でエラー:`, error);
        // エラーの場合はワークフローを終了
        throw new Error(
          `チャンク ${chunkNumber} の処理中にエラーが発生しました: ${error}`
        );
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

    return {
      translatedContent: finalValidation.adjustedText,
      originalLineCount: originalLines.length,
      translatedLineCount: finalValidation.adjustedText.split('\n').length,
      isValid: finalValidation.isValid,
    };
  }
}
