import { PromptTemplate } from '@langchain/core/prompts';
import type { Agent } from './agent';
import { RuunableLanguageModel } from './types';

/**
 * Prompt template for translation
 */
export const TRANSLATE_PROMPT_TEMPLATE = `あなたは技術文書の翻訳専門家です。以下のマークダウンテキストを日本語に翻訳してください。

## 重要な注意事項

- **マークダウンの構造を絶対に変更しないでください**
- **行数を絶対に変更しないでください** - 入力と出力の行数は必ず同じにしてください
- **コードブロック内の内容は翻訳しないでください**
- **URL、ファイル名、識別子は翻訳しないでください**
- **HTML タグや特殊な記号は保持してください**
- **リストの階層構造とマーカー（\\*, -, +, 1.など）を維持してください**
- **見出しレベル（#の数）は変更しないでください**
- **空行は空行のまま保持してください**
- **インデントやスペースを保持してください**
- **技術用語は適切な日本語に翻訳してください**
- **特別なプレフィックスは絶対に変更しないでください**
  - 例: NOTE/TIP/HELPFUL/IMPORTANT/QUESTION/TLDR/CRITICAL

翻訳されたテキストのみを返してください。他の説明や追加のテキストは含めないでください。テキスト全体をコードブロックとしてラップしないでください。

### 追加の指示
今回のタスクにおける以下の特別な指示を遵守してください。

{additionalInstructions}

## Context

{context}

## Content to Translate

翻訳対象テキスト:
{content}`;

/**
 * Input for AI translation runnable
 */
export interface TranslationRunnableInput {
  /** The content to translate */
  content: string;
  /** Additional context for translation */
  context: string;
  /** Additional translation instructions */
  additionalInstructions: string;
}

/**
 * Input for translation agent
 */
export interface TranslationInput {
  /** The text to translate */
  text: string;
  /** Optional retry reason for context */
  retryReason?: string;
  /** Previous failed translation attempt for retry context */
  previousFailedAttempt?: string;
}

export class Translator implements Agent<TranslationInput, string> {
  constructor(
    private readonly model: RuunableLanguageModel,
    private readonly additionalInstructions: string = ''
  ) {}

  /**
   * Executes the translation agent's main processing task
   * @param input - Translation input containing text, context, and options
   * @returns Promise resolving to translated text
   */
  async run(input: TranslationInput): Promise<string> {
    const { text, retryReason, previousFailedAttempt } = input;

    let context = '';
    if (retryReason) {
      context = `この翻訳は前回の試行で失敗しました。\n理由: ${retryReason}`;

      if (previousFailedAttempt) {
        context += `\n\n前回の失敗した翻訳結果:\n---${previousFailedAttempt}\n---\n`;
      }
    }

    const chain = PromptTemplate.fromTemplate(TRANSLATE_PROMPT_TEMPLATE).pipe(
      this.model
    );

    const translatedText = (await chain.invoke({
      content: text,
      context: context,
      additionalInstructions: this.additionalInstructions,
    })) as string;

    return translatedText;
  }
}
