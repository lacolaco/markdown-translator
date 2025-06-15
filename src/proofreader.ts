import { PromptTemplate } from '@langchain/core/prompts';
import type { Agent } from './agent';
import { type TextlintRunner } from './textlint-runner';
import { RuunableLanguageModel } from './types';

/**
 * Prompt template for proofreading
 */
export const PROOFREAD_PROMPT_TEMPLATE = `あなたは日本語で書かれた文書の校正専門家です。以下のマークダウンテキストにtextlintによる校正エラーが検出されました。エラーで指摘された表現を修正したテキストを返してください。

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

## Retry Context

{retryContext}

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
  /** Optional retry reason for context */
  retryReason?: string;
  /** Previous failed proofreading attempt for retry context */
  previousFailedAttempt?: string;
}

/**
 * Output from proofreading agent
 */
export interface ProofreadResult {
  /** The proofread text */
  fixedText: string;
  /** Remaining textlint errors, if any */
  remainingErrors?: string;
}

export class Proofreader implements Agent<ProofreadInput, ProofreadResult> {
  constructor(
    private readonly model: RuunableLanguageModel,
    private readonly textlintRunner: TextlintRunner
  ) {}

  /**
   * Executes the proofreading agent's main processing task
   * @param input - Proofreading input containing text, error message, and context
   * @returns Promise resolving to proofreading result with corrected text and remaining errors
   */
  async run(input: ProofreadInput): Promise<ProofreadResult> {
    const { text, retryReason, previousFailedAttempt } = input;

    const diagnostics = await this.textlintRunner.lintText(text);

    // If no errors are found, return the original text
    if (diagnostics.messages.length === 0) {
      return {
        fixedText: text,
        remainingErrors: undefined,
      };
    }

    const fixedText = await this.correctTextErrors(
      text,
      diagnostics.formattedMessage,
      retryReason,
      previousFailedAttempt
    );

    // Re-run textlint to check if there are any remaining errors
    const remainingDiagnostics = await this.textlintRunner.lintText(fixedText);
    return {
      fixedText,
      remainingErrors:
        remainingDiagnostics.messages.length > 0
          ? remainingDiagnostics.formattedMessage
          : undefined,
    };
  }

  private async correctTextErrors(
    text: string,
    errorMessage: string,
    retryReason?: string,
    previousFailedAttempt?: string
  ): Promise<string> {
    if (errorMessage === '') {
      return text; // No errors to correct
    }

    let retryContext = '';
    if (retryReason) {
      retryContext = `この校正は前回の試行で失敗しました。今回は前回と違うアプローチで修正してください。\n理由: ${retryReason}`;

      if (previousFailedAttempt) {
        retryContext += `\n\n前回の失敗した修正結果:\n---\n${previousFailedAttempt}\n---\n`;
      }
    }

    const chain = PromptTemplate.fromTemplate(PROOFREAD_PROMPT_TEMPLATE).pipe(
      this.model
    );

    try {
      return await chain.invoke({
        message: errorMessage,
        content: text,
        retryContext,
      });
    } catch (error) {
      return text;
    }
  }
}
