import * as fs from 'fs/promises';
import { Translator } from './translator';
import { Proofreader } from './proofreader';
import { DebugLogger } from './debug-logger';
import type { TranslationOptions } from './types';

export class TranslationWorkflow {
  private translator: Translator;
  private proofreader: Proofreader;
  private debugLogger: DebugLogger;

  constructor(options: TranslationOptions = {}) {
    this.debugLogger = new DebugLogger();
    this.translator = new Translator(options.chunkSize || 2000, this.debugLogger);
    this.proofreader = new Proofreader();
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

    // 翻訳処理
    const translatedContent = await this.translator.translate(originalContent, maxRetries);

    // 翻訳完了時点（校正前）の結果をデバッグ出力
    await this.debugLogger.logTranslatedResult(translatedContent);

    // 校正処理
    console.log('\n📝 Textlintによる校正を実行中...');
    const finalContent = await this.proofreader.proofread(translatedContent, maxRetries);

    // 最終結果をデバッグ出力
    await this.debugLogger.logFinalResult(finalContent);

    // ファイルに保存
    if (outputPath) {
      await fs.writeFile(outputPath, finalContent, 'utf-8');
      console.log(`\n✅ 翻訳完了: ${outputPath}`);
      console.log(
        `最終確認: ${finalContent.split('\n').length} 行 (元: ${originalLines.length} 行)`
      );
    }

    return finalContent;
  }

  async debugChunks(inputPath: string): Promise<void> {
    console.log(`チャンク分割デバッグ: ${inputPath}`);
    
    const content = await this.readFile(inputPath);
    await this.translator.debugChunks(content);
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`ファイル読み込みエラー: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    await this.translator.cleanup();
    await this.proofreader.cleanup();
  }
}