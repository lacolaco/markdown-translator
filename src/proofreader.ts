import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import type { Agent } from './agent';
import { loadPromptTemplate } from './prompt-loader';
import { retryUntilSuccess } from './retry-utils';
import { getTextlintDiagnostics } from './textlint-service';

/**
 * Input for proofreading agent
 */
export interface ProofreadInput {
  /** The text to proofread */
  text: string;
  /** Maximum retry attempts */
  maxRetries?: number;
}

/**
 * Output from proofreading agent
 */
export interface ProofreadResult {
  /** The proofread text */
  text: string;
  /** Remaining textlint errors, if any */
  error?: string;
}

export class Proofreader implements Agent<ProofreadInput, ProofreadResult> {
  private llm: BaseLanguageModel;
  private correctPrompt: PromptTemplate;

  private constructor(llm: BaseLanguageModel, correctPrompt: PromptTemplate) {
    this.llm = llm;
    this.correctPrompt = correctPrompt;
  }

  /**
   * Creates a new Proofreader instance with dynamically loaded prompt
   * @param llm - Language model instance (required)
   * @returns Promise resolving to Proofreader instance
   */
  static async create(llm: BaseLanguageModel): Promise<Proofreader> {
    const correctPrompt = await loadPromptTemplate('proofread');
    return new Proofreader(llm, correctPrompt);
  }

  /**
   * Executes the proofreading agent's main processing task
   * @param input - Proofreading input containing text and options
   * @returns Promise resolving to proofread result with text and any remaining errors
   */
  async run(input: ProofreadInput): Promise<ProofreadResult> {
    const { text, maxRetries = 3 } = input;
    return this.proofread(text, maxRetries);
  }

  private async proofread(
    text: string,
    maxRetries: number = 3
  ): Promise<ProofreadResult> {
    let currentText = text;

    const result = await retryUntilSuccess({
      maxAttempts: maxRetries,
      attempt: async () => {
        const diagnostics = await getTextlintDiagnostics(currentText);

        if (diagnostics.messages.length === 0) {
          return {
            hasErrors: false,
            result: diagnostics.fixedText,
            error: null,
          };
        }

        const correctedText = await this.correctTextWithErrors(
          diagnostics.fixedText,
          diagnostics.formattedMessage
        );

        // Update currentText for next iteration
        currentText = correctedText;

        return {
          hasErrors: true,
          result: correctedText,
          error: diagnostics.formattedMessage,
        };
      },
      isSuccess: result => !result.hasErrors,
      onMaxAttemptsReached: lastResult => {
        if (lastResult) {
          return {
            hasErrors: false,
            result: lastResult.result,
            error: lastResult.error,
          };
        }
        return { hasErrors: false, result: text, error: null };
      },
    });

    return {
      text: result.result,
      error: result.error || undefined,
    };
  }

  private async correctTextWithErrors(
    text: string,
    message: string
  ): Promise<string> {
    if (message === '') {
      return text;
    }

    const chain = this.correctPrompt
      .pipe(this.llm)
      .pipe(new StringOutputParser());

    try {
      const correctedText = (await chain.invoke({
        message,
        content: text,
      })) as string;

      // 末尾の改行を調整
      const trimmedResult = correctedText.replace(/\n+$/, '');

      // 行数チェック
      const originalLines = text.split('\n');
      const correctedLines = trimmedResult.split('\n');

      if (originalLines.length !== correctedLines.length) {
        // 末尾に改行を1つ追加すると行数が一致するかチェック
        const correctedWithNewline = trimmedResult + '\n';
        const correctedLinesWithNewline = correctedWithNewline.split('\n');

        if (originalLines.length === correctedLinesWithNewline.length) {
          return correctedWithNewline;
        }

        return text;
      }

      return trimmedResult;
    } catch (error) {
      return text;
    }
  }
}
