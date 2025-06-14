import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import type { Agent } from './agent';
import { retryUntilSuccess } from './retry-utils';
import { validateLineCount } from './line-count-validator';
import { getTextlintDiagnostics } from './textlint-service';

/**
 * Prompt template for proofreading
 */
const PROOFREAD_PROMPT_TEMPLATE = `あなたは日本語で書かれた文書の校正専門家です。以下のマークダウンテキストにtextlintによる校正エラーが検出されました。エラーで指摘された表現を修正したテキストを返してください。

## 重要な注意事項

1. **マークダウンの構造を絶対に変更しないでください**
2. **行数を絶対に変更しないでください** - 入力と出力の行数は必ず同じにしてください
3. **コードブロック内の内容は変更しないでください**
4. **URL、ファイル名、識別子は変更しないでください**
5. **HTML タグや特殊な記号は保持してください**
6. **リストの階層構造とマーカー（*, -, +, 1.など）を維持してください**
7. **見出しレベル（#の数）を変更しないでください**
8. **空行は空行のまま保持してください**
9. **インデントやスペースを保持してください**
10. **指摘されたエラーのみを修正してください**

修正されたテキストのみを返してください。他の説明や追加のテキストは含めないでください。テキスト全体をコードブロックとしてラップしないでください。

## Errors to Fix

各エラーには以下の情報が含まれています。すべてのエラーを修正してください。

- **ルール名**: エラーを検出したtextlintルールの名前
- **メッセージ**: エラーの詳細な説明
- **行番号**: エラーが発生した行の番号
- **行の内容**: エラーが発生した行の内容
- **修正提案**: エラーを修正するための提案

校正エラー一覧:

{message}

## Content to Proofread

修正対象テキスト(\`temp.md\`):

{content}`;

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
   * Creates a new Proofreader instance with prompt template
   * @param llm - Language model instance (required)
   * @returns Promise resolving to Proofreader instance
   */
  static async create(llm: BaseLanguageModel): Promise<Proofreader> {
    const correctPrompt = PromptTemplate.fromTemplate(
      PROOFREAD_PROMPT_TEMPLATE
    );
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
      attempt: async (retryReason?: string) => {
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
      validate: result =>
        result.hasErrors ? 'textlintエラーが残っています' : true,
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

      // 行数チェックと調整
      const validation = validateLineCount(text, correctedText);
      if (!validation.isValid) {
        throw new Error(
          `行数が一致しません: 元の行数=${text.split('\n').length}, 修正後の行数=${correctedText.split('\n').length}`
        );
      }
      return validation.adjustedText;
    } catch (error) {
      return text;
    }
  }
}
