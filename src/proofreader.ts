import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getTextlintDiagnostics } from './textlint-service';

export class Proofreader {
  private llm: ChatGoogleGenerativeAI;
  private correctPrompt: PromptTemplate;
  private parser: StringOutputParser;

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: 'gemini-2.0-flash',
      temperature: 0.1, // 低い温度で一貫性を重視
    });

    this.parser = new StringOutputParser();

    this.correctPrompt = PromptTemplate.fromTemplate(`
あなたは技術文書の校正専門家です。以下のマークダウンテキストにtextlintによる校正エラーが検出されました。エラーを修正したテキストを返してください。

重要な注意事項：
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

修正されたマークダウンテキストのみを返してください。他の説明や追加のテキストは含めないでください。

校正エラー一覧:
{message}

修正対象テキスト:
{content}
`);
  }

  async proofread(text: string, maxRetries: number = 3): Promise<string> {
    const proofreadIteration = async (currentText: string, attempt: number): Promise<string> => {
      console.log(`校正処理 ${attempt}/${maxRetries} 回目を実行中...`);

      try {
        const diagnostics = await getTextlintDiagnostics(currentText);
        
        if (diagnostics.messages.length === 0) {
          console.log(`✓ 校正完了: ${attempt}回目でエラーが解消されました`);
          return diagnostics.fixedText;
        }

        console.log(`  textlintエラー数: ${diagnostics.messages.length}`);
        console.warn(diagnostics.formattedMessage);
        
        const correctedText = await this.correctTextWithErrors(
          diagnostics.fixedText,
          diagnostics.formattedMessage
        );

        if (attempt >= maxRetries) {
          console.warn(`  ${maxRetries}回の試行後もエラーが残っています。最終結果を返します。`);
          return correctedText;
        }

        return proofreadIteration(correctedText, attempt + 1);
      } catch (error) {
        console.error(`  ❌ 校正処理エラー (${attempt}回目): ${error}`);
        if (attempt >= maxRetries) {
          console.warn(`  最大試行回数に達しました。元のテキストを返します。`);
          return text;
        }
        return proofreadIteration(currentText, attempt + 1);
      }
    };

    return proofreadIteration(text, 1);
  }

  private async correctTextWithErrors(text: string, message: string): Promise<string> {
    if (message === '') {
      return text;
    }

    const chain = this.correctPrompt.pipe(this.llm).pipe(this.parser);

    try {
      console.log(`  LLMによる校正修正を実行中...`);
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
          console.log(`  ✓ LLM校正完了（末尾改行追加で行数調整）`);
          return correctedWithNewline;
        }

        console.warn(
          `  ⚠️ LLM校正後の行数が一致しません (元: ${originalLines.length}, 修正後: ${correctedLines.length})`
        );
        console.warn(`  元のテキストを使用します`);
        return text;
      }

      console.log(`  ✓ LLM校正完了`);
      return trimmedResult;
    } catch (error) {
      console.error(`  ❌ LLM校正エラー: ${error}`);
      return text;
    }
  }

  async cleanup(): Promise<void> {
    // LLMクライアントのクリーンアップ（必要に応じて）
    // 現在のLangChainのGoogle GenerativeAIクライアントには明示的なクローズメソッドがないため、
    // 何もしない
  }
}