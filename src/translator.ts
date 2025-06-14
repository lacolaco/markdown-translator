import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { retryUntilSuccess } from './retry-utils';
import { validateLineCount } from './line-count-validator';
import type { Agent } from './agent';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { RunnableSequence } from '@langchain/core/runnables';

/**
 * Prompt template for translation
 */
const TRANSLATE_PROMPT_TEMPLATE = `あなたは技術文書の翻訳専門家です。以下のマークダウンテキストを日本語に翻訳してください。

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

- **助詞の連続を割ける**: (textlintルール: \`no-doubled-joshi\`)
  - 助詞の連続を避けるために、適切な表現を使用してください。
  - OK: 私は彼が好きだ/オブジェクトを返す関数を公開した/これがiPhone，これがAndroidです。/言うのは簡単の法則。
  - NG: 私は彼は好きだ/材料不足で代替素材で製品を作った。/列車事故でバスで振り替え輸送を行った。/法律案は十三日の衆議院本会議で賛成多数で可決され、参議院に送付されます/これは\`obj.method\`は何をしているかを示します。/これとあれとそれを持ってきて。

## Context

{context}

## Content to Translate

翻訳対象テキスト:
{content}`;

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

  private constructor(llm: BaseLanguageModel) {
    this.llm = llm;
  }

  /**
   * Creates a new Translator instance with prompt template
   * @param llm - Language model instance (required)
   * @returns Promise resolving to Translator instance
   */
  static async create(llm: BaseLanguageModel): Promise<Translator> {
    return new Translator(llm);
  }

  /**
   * Executes the translation agent's main processing task
   * @param input - Translation input containing text, context, and options
   * @returns Promise resolving to translated text
   */
  async run(input: TranslationInput): Promise<string> {
    const { text, maxRetries = 3 } = input;
    return this.translateChunk(text, maxRetries);
  }

  /**
   * Translates a single chunk of text
   * @param text - The chunk text to translate
   * @param maxRetries - Maximum number of retry attempts
   * @returns Promise resolving to translated text
   */
  async translateChunk(text: string, maxRetries: number = 3): Promise<string> {
    const translationRunnable = RunnableSequence.from([
      PromptTemplate.fromTemplate(TRANSLATE_PROMPT_TEMPLATE),
      this.llm,
      new StringOutputParser(),
    ]);

    const result = await retryUntilSuccess({
      maxAttempts: maxRetries,
      attempt: async (retryReason?: string) => {
        const translatedText = (await translationRunnable.invoke({
          content: text,
          context: this.buildTranslationContext(retryReason),
        })) as string;
        return validateLineCount(text, translatedText);
      },
      validate: result =>
        result.isValid ? true : '翻訳前後の行数が一致しません',
      onMaxAttemptsReached: lastResult => {
        if (lastResult) {
          return lastResult;
        }
        throw new Error(`最大リトライ回数に達しました`);
      },
    });

    return result.adjustedText;
  }

  /**
   *  Builds the context string for the translation prompt
   * @param retryReason - Optional reason for retrying the translation
   * @returns Context string for the prompt
   */
  private buildTranslationContext(retryReason?: string): string {
    if (retryReason) {
      return `この翻訳は前回の試行で失敗しました。理由: ${retryReason}`;
    }

    return '';
  }
}
