import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { loadPromptTemplate } from './prompt-loader';
import { retryUntilSuccess } from './retry-utils';
import { validateLineCount } from './line-count-validator';
import type { Agent } from './agent';
import type { DebugLogger } from './debug-logger';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';

/**
 * Input for translation agent
 */
export interface TranslationInput {
  /** The text to translate */
  text: string;
  /** Previous translations for context */
  previousTranslations?: string[];
  /** Maximum retry attempts */
  maxRetries?: number;
}

export class Translator implements Agent<TranslationInput, string> {
  private llm: BaseLanguageModel;
  private translatePrompt: PromptTemplate;

  private constructor(
    _debugLogger: DebugLogger | undefined,
    llm: BaseLanguageModel,
    translatePrompt: PromptTemplate
  ) {
    this.llm = llm;
    this.translatePrompt = translatePrompt;
  }

  /**
   * Creates a new Translator instance with dynamically loaded prompt
   * @param llm - Language model instance (required)
   * @param debugLogger - Optional debug logger
   * @returns Promise resolving to Translator instance
   */
  static async create(
    llm: BaseLanguageModel,
    debugLogger?: DebugLogger
  ): Promise<Translator> {
    const translatePrompt = await loadPromptTemplate('translate');
    return new Translator(debugLogger, llm, translatePrompt);
  }

  /**
   * Executes the translation agent's main processing task
   * @param input - Translation input containing text, context, and options
   * @returns Promise resolving to translated text
   */
  async run(input: TranslationInput): Promise<string> {
    const { text, previousTranslations = [], maxRetries = 3 } = input;
    return this.translateChunk(text, previousTranslations, maxRetries);
  }

  /**
   * Translates a single chunk of text with context from previous translations
   * @param text - The chunk text to translate
   * @param previousTranslations - Array of previously translated chunks for context
   * @param maxRetries - Maximum number of retry attempts
   * @returns Promise resolving to translated text
   */
  async translateChunk(
    text: string,
    previousTranslations: string[] = [],
    maxRetries: number = 3
  ): Promise<string> {
    const chain = this.translatePrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    return retryUntilSuccess({
      maxAttempts: maxRetries,
      attempt: async () => {
        // 前段の翻訳結果をコンテキストとして構築
        const contextInfo = this.buildTranslationContext(previousTranslations);

        const translatedText = (await chain.invoke({
          content: text,
          context: contextInfo,
        })) as string;

        // 行数チェック
        const validation = validateLineCount(text, translatedText);
        return validation;
      },
      isSuccess: validation => validation.isValid,
      onMaxAttemptsReached: () => {
        return { isValid: true, adjustedText: text };
      },
    }).then(validation => validation.adjustedText);
  }

  /**
   * Builds translation context from previous translations for consistency
   * @param previousTranslations - Array of previously translated chunks
   * @returns Context string for the prompt
   */
  private buildTranslationContext(previousTranslations: string[]): string {
    if (previousTranslations.length === 0) {
      return '前段の翻訳結果: なし（最初のチャンクです）';
    }

    // 最後の2つの翻訳結果を参考情報として提供（プロンプトが長くなりすぎないように）
    const recentTranslations = previousTranslations.slice(-2);
    const contextParts = recentTranslations.map((translation, index) => {
      const chunkNum =
        previousTranslations.length - recentTranslations.length + index + 1;
      // 長すぎる場合は先頭と末尾を表示
      const preview =
        translation.length > 200
          ? translation.substring(0, 100) +
            '\n...\n' +
            translation.substring(translation.length - 100)
          : translation;
      return `チャンク${chunkNum}の翻訳結果:\n${preview}`;
    });

    return [
      '前段の翻訳結果（用語や表現の一貫性を保つため参考にしてください）:',
      '',
      ...contextParts,
    ].join('\n');
  }
}
