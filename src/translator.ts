import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SemanticChunker } from './semantic-chunker';
import type { DebugLogger } from './debug-logger';

export class Translator {
  private llm: ChatGoogleGenerativeAI;
  private translatePrompt: PromptTemplate;
  private parser: StringOutputParser;
  private chunker: SemanticChunker;
  private debugLogger?: DebugLogger;

  constructor(maxChunkSize: number = 2000, debugLogger?: DebugLogger) {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: 'gemini-2.0-flash',
      temperature: 0.3,
    });

    this.debugLogger = debugLogger;
    this.chunker = new SemanticChunker(maxChunkSize);
    this.parser = new StringOutputParser();

    this.translatePrompt = PromptTemplate.fromTemplate(`
あなたは技術文書の翻訳専門家です。以下のマークダウンテキストを日本語に翻訳してください。

重要な注意事項：
- **マークダウンの構造を絶対に変更しないでください**
- **行数を絶対に変更しないでください** - 入力と出力の行数は必ず同じにしてください
- **コードブロック内の内容は翻訳しないでください**
- **URL、ファイル名、識別子は翻訳しないでください**
- **HTML タグや特殊な記号は保持してください**
- **リストの階層構造とマーカー（*, -, +, 1.など）を維持してください**
- **見出しレベル（#の数）は変更しないでください**
- **空行は空行のまま保持してください**
- **インデントやスペースを保持してください**
- **技術用語は適切な日本語に翻訳してください**
- **特別なプレフィックスは絶対に変更しないでください**
  例: NOTE/TIP/HELPFUL/IMPORTANT/QUESTION/TLDR/CRITICAL

翻訳されたマークダウンテキストのみを返してください。他の説明や追加のテキストは含めないでください。

翻訳対象テキスト:
{content}
`);
  }

  async translate(content: string, maxRetries: number = 3): Promise<string> {
    console.log('📝 セマンティックチャンクベース翻訳を開始...');

    // 1. セマンティックチャンクに分割
    const chunks = await this.chunker.chunkMarkdown(content);
    const stats = this.chunker.getChunkStats(chunks);

    console.log(`📊 チャンク統計:`);
    console.log(`  総チャンク数: ${stats.totalChunks}`);

    // 2. チャンク情報をログ出力
    if (this.debugLogger) {
      await this.debugLogger.logSemanticChunks(chunks);
    }

    // 3. 各チャンクを翻訳
    const translatedChunks = await Promise.all(
      chunks.map(async (chunk, index) => {
        const chunkNumber = index + 1;
        console.log(
          `📝 チャンク ${chunkNumber}/${chunks.length} を翻訳中... (${chunk.content.length}文字)`
        );

        try {
          const translatedText = await this.translateChunk(
            chunk.content,
            maxRetries
          );

          if (this.debugLogger) {
            await this.debugLogger.logTranslatedChunk(
              chunkNumber - 1,
              chunk.content.split('\n'),
              translatedText.split('\n')
            );
          }

          return translatedText;
        } catch (error) {
          console.error(`チャンク ${chunkNumber} の翻訳に失敗:`, error);
          return chunk.content;
        }
      })
    );

    // 4. 翻訳結果を結合
    const result = translatedChunks.join('');

    // 5. 行数チェック
    const originalLines = content.split('\n');
    const translatedLines = result.split('\n');

    if (originalLines.length !== translatedLines.length) {
      console.warn(
        `⚠️ 翻訳後の行数が一致しません (元: ${originalLines.length}, 翻訳後: ${translatedLines.length})`
      );
    } else {
      console.log(`✅ 翻訳完了: 行数一致 (${originalLines.length} 行)`);
    }

    return result;
  }

  private async translateChunk(
    text: string,
    maxRetries: number
  ): Promise<string> {
    const chain = this.translatePrompt.pipe(this.llm).pipe(this.parser);

    const attempts = Array.from({ length: maxRetries }, (_, i) => i + 1);

    for (const attempt of attempts) {
      try {
        const translatedText = (await chain.invoke({
          content: text,
        })) as string;

        // 行数チェック
        const originalLines = text.split('\n');
        const translatedLines = translatedText.split('\n');

        if (originalLines.length === translatedLines.length) {
          return translatedText;
        }

        console.warn(
          `  ⚠️ 試行 ${attempt}: 行数が一致しません (元: ${originalLines.length}, 翻訳後: ${translatedLines.length})`
        );

        if (attempt === maxRetries) {
          console.warn('  最大試行回数に達しました。元のテキストを返します。');
          return text;
        }
      } catch (error) {
        console.error(`  ❌ 試行 ${attempt} でエラー:`, error);
        if (attempt === maxRetries) {
          console.warn('  最大試行回数に達しました。元のテキストを返します。');
          return text;
        }
      }
    }

    return text;
  }

  async debugChunks(content: string): Promise<void> {
    console.log('🔍 チャンク分割デバッグモード');

    const chunks = await this.chunker.chunkMarkdown(content);
    const stats = this.chunker.getChunkStats(chunks);

    console.log(`\n📊 チャンク統計:`);
    console.log(`  総チャンク数: ${stats.totalChunks}`);
    console.log(`  平均文字数: ${stats.averageSize}`);
    console.log(`  最大チャンク: ${stats.maxSize} 文字`);

    console.log(`\n📝 各チャンクの詳細:`);
    chunks.forEach((chunk, index) => {
      console.log(
        `\n--- チャンク ${index + 1} (${chunk.content.length} 文字) ---`
      );
      console.log(
        chunk.content.substring(0, 200) +
          (chunk.content.length > 200 ? '...' : '')
      );
    });
  }

  async cleanup(): Promise<void> {
    // LLMクライアントのクリーンアップ（必要に応じて）
    // 現在のLangChainのGoogle GenerativeAIクライアントには明示的なクローズメソッドがないため、
    // 何もしない
  }
}
