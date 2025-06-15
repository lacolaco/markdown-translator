import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { Agent } from './agent';
import { Proofreader, type ProofreadResult } from './proofreader';
import { chunkMarkdown, getChunkStats, joinChunks } from './semantic-chunker';
import { Translator } from './translator';
import type { TranslationOptions } from './types';
import type { DebugFileWriter } from './utils/debug-writer';
import {
  formatLineCountMessage,
  getLineCount,
  validateLineCount,
} from './utils/line-validation';
import { Logger } from './utils/logger';
import { retryUntilSuccess, type LastAttemptResult } from './utils/retry';
import { TextlintRunner } from './textlint-runner';

// TranslationWorkflow Agent types
export interface TranslationWorkflowInput {
  content: string;
  options?: TranslationOptions;
}

export interface TranslationWorkflowOutput {
  translatedContent: string;
  hasProofreadErrors: boolean;
}

export class TranslationWorkflow
  implements Agent<TranslationWorkflowInput, TranslationWorkflowOutput>
{
  private translator: Translator;
  private proofreader: Proofreader;
  private debugFileWriter: DebugFileWriter;

  /**
   * Creates a new TranslationWorkflow instance
   * @param googleApiKey - Google API key for LLM instances
   * @param debugFileWriter - DebugFileWriter instance for debug output
   * @param additionalInstructions - Additional instructions for translation (default: '')
   */
  constructor(
    googleApiKey: string,
    debugFileWriter: DebugFileWriter,
    textlintRunner: TextlintRunner,
    additionalInstructions: string = ''
  ) {
    // Translation runnable を作成
    const translationModel = RunnableSequence.from([
      new ChatGoogleGenerativeAI({
        apiKey: googleApiKey,
        model: 'gemini-2.5-flash-preview-05-20',
        temperature: 0.5, // 翻訳の一貫性を重視
      }),
      new StringOutputParser(),
    ]);

    const proofreadingModel = RunnableSequence.from([
      new ChatGoogleGenerativeAI({
        apiKey: googleApiKey,
        model: 'gemini-2.5-flash-preview-05-20',
        temperature: 0.8, // エラー修正への柔軟性を持たせる
        cache: false,
      }),
      new StringOutputParser(),
    ]);

    // インスタンスを作成
    this.translator = new Translator(translationModel, additionalInstructions);
    this.proofreader = new Proofreader(proofreadingModel, textlintRunner);

    // DebugFileWriterを注入
    this.debugFileWriter = debugFileWriter;
  }

  async run(
    input: TranslationWorkflowInput
  ): Promise<TranslationWorkflowOutput> {
    const { content, options } = input;
    return this.translateMarkdownContent(content, options);
  }

  private async translateMarkdownContent(
    originalContent: string,
    options: TranslationOptions = {}
  ): Promise<TranslationWorkflowOutput> {
    const maxRetries = options.maxRetries || 3;
    // デバッグファイルライターの初期化
    await this.debugFileWriter.initialize();

    const originalLineCount = getLineCount(originalContent);
    Logger.stats('ファイルサイズ', `${originalContent.length} 文字`);
    Logger.stats('総行数', `${originalLineCount} 行`);

    // 1. チャンクに分割
    const chunks = await chunkMarkdown(originalContent);
    const stats = getChunkStats(chunks);
    Logger.stats('総チャンク数', stats.totalChunks);

    // 2. 各チャンクを順次処理（翻訳→校正）
    const processedChunks: string[] = [];
    let hasProofreadErrors = false;

    for (const [index, chunk] of chunks.entries()) {
      const chunkNumber = index + 1;
      Logger.step(
        `チャンク ${chunkNumber}/${chunks.length} を処理中... (${chunk.startLine}-${chunk.endLine}行/${originalLineCount}行)`
      );

      try {
        // 入力のデバッグ出力
        await this.debugFileWriter.writeChunkInput(index, chunk.content);

        // 翻訳（リトライ機構付き）
        const translatedText = await retryUntilSuccess<string>({
          maxAttempts: maxRetries,
          attempt: async (lastAttemptResult?: LastAttemptResult<string>) => {
            return await this.translator.run({
              text: chunk.content,
              retryReason: lastAttemptResult?.failureReason,
              previousFailedAttempt: lastAttemptResult?.previousResult,
            });
          },
          validate: translatedText => {
            const validationResult = validateLineCount(
              chunk.content,
              translatedText
            );
            if (validationResult.isValid) {
              return true;
            } else {
              return '翻訳前後の行数が一致しません';
            }
          },
          onMaxAttemptsReached: lastResult => lastResult,
        });

        // 行数チェックと調整
        const validationResult = validateLineCount(
          chunk.content,
          translatedText
        );
        const translatedChunk = validationResult.adjustedText;

        // 翻訳結果のデバッグ出力
        await this.debugFileWriter.writeChunkTranslated(index, translatedChunk);

        // 翻訳の行数チェック結果をログ出力
        if (!validationResult.isValid) {
          Logger.subwarning(
            formatLineCountMessage(chunk.content, translatedChunk, '翻訳')
          );
        } else {
          Logger.substep(
            formatLineCountMessage(chunk.content, translatedChunk, '翻訳')
          );
        }

        // 校正（リトライ機構付き）
        const proofreadResult = await retryUntilSuccess<ProofreadResult>({
          maxAttempts: maxRetries,
          attempt: async (
            lastAttemptResult?: LastAttemptResult<ProofreadResult>
          ) => {
            // LLMで校正を実行
            return await this.proofreader.run({
              text: translatedChunk,
              retryReason: lastAttemptResult?.failureReason,
              previousFailedAttempt:
                lastAttemptResult?.previousResult?.fixedText,
            });
          },
          validate: result => {
            // 行数チェック
            const validation = validateLineCount(
              translatedChunk,
              result.fixedText
            );
            if (!validation.isValid) {
              return '校正後の行数が一致しません';
            }

            // textlintエラーチェック
            if (result.remainingErrors) {
              return `textlintエラーが残っています: ${result.remainingErrors}`;
            }

            return true;
          },
          onMaxAttemptsReached: lastResult => lastResult,
        });

        // 校正エラーがあった場合はフラグを立てる
        if (proofreadResult.remainingErrors) {
          hasProofreadErrors = true;
          Logger.subwarning(`校正完了（エラーあり）`);
        } else {
          Logger.substep('校正完了');
        }

        // 行数チェックと調整を最後に実行
        const validation = validateLineCount(
          translatedChunk,
          proofreadResult.fixedText
        );
        const finalText = validation.adjustedText;

        // 最終結果のデバッグ出力
        await this.debugFileWriter.writeChunkOutput(index, finalText);

        processedChunks.push(finalText);
      } catch (error) {
        Logger.error(`チャンク ${chunkNumber} でエラー:`, error);
        // エラーの場合はワークフローを終了
        throw new Error(
          `チャンク ${chunkNumber} の処理中にエラーが発生しました: ${error}`
        );
      }
    }

    // 3. チャンクを結合
    Logger.info('🔗 チャンクを結合中...');
    const finalContent = joinChunks(processedChunks);

    // 4. 最終的な行数チェック
    const finalValidation = validateLineCount(originalContent, finalContent);
    if (!finalValidation.isValid) {
      Logger.error(
        '最終結果の行数が一致しません。チャンク境界の問題の可能性があります。'
      );
    }

    // 最終結果をデバッグ出力
    await this.debugFileWriter.writeFinalResult(finalValidation.adjustedText);

    return {
      translatedContent: finalValidation.adjustedText,
      hasProofreadErrors,
    };
  }
}
