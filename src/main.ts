import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseArgs } from 'node:util';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { StructuredToolInterface } from '@langchain/core/tools';

interface ChunkMetadata {
  index: number;
  totalChunks: number;
  hasCodeBlocks: boolean;
  headingLevel: number;
  startLine: number;
  endLine: number;
}

interface LineInfo {
  content: string;
  lineNumber: number;
  isInCodeBlock: boolean;
  isEmpty: boolean;
  isHeading: boolean;
  needsTranslation: boolean;
}

class MarkdownTranslator {
  private llm: ChatGoogleGenerativeAI;
  private translatePrompt: PromptTemplate;
  private proofreadPrompt: PromptTemplate;
  private maxLines: number;
  private mcpClient: MultiServerMCPClient | null = null;
  private textlintTool: StructuredToolInterface | null = null;

  constructor(maxLines: number = 100) {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.0-flush",
      temperature: 0.3,
    });

    this.maxLines = maxLines;

    this.translatePrompt = PromptTemplate.fromTemplate(`
あなたは技術文書の翻訳専門家です。以下の行を日本語に翻訳してください。

重要な注意事項：
1. **行数を絶対に変更しないでください** - 入力と出力の行数は必ず同じにしてください
2. 空行は空行のまま保持してください
3. Markdownの書式（#, *, \`, [](), など）は絶対に変更しないでください
4. コードブロック内のコードは翻訳しないでください
5. URLやリンクは変更しないでください
6. 各行は独立して翻訳し、改行で区切ってください
7. 技術用語は適切な日本語に翻訳するか、必要に応じて英語のまま残してください

翻訳対象のテキスト（行番号 {start_line}-{end_line}）:
{lines_content}

翻訳結果（同じ行数で出力してください）:
`);

    this.proofreadPrompt = PromptTemplate.fromTemplate(`
あなたは日本語の校正専門家です。textlintから指摘されたエラーを修正してください。

重要な注意事項：
1. **行数を絶対に変更しないでください** - 入力と出力の行数は必ず同じにしてください
2. textlintの指摘のみを修正し、不要な変更は行わないでください
3. Markdownの書式は保持してください
4. 自然で読みやすい日本語に修正してください

元のテキスト:
{original_text}

textlintからの指摘:
{lint_errors}

修正されたテキスト（同じ行数で出力してください）:
`);
  }

  // MCPクライアントの初期化
  async initializeMCP(): Promise<void> {
    try {
      // textlint MCP サーバーの設定
      this.mcpClient = new MultiServerMCPClient({
        // グローバル設定
        throwOnLoadError: false, // ツール読み込みエラーで停止しない
        prefixToolNameWithServerName: true,
        additionalToolNamePrefix: "mcp",
        useStandardContentBlocks: true,
        
        // サーバー設定
        mcpServers: {
          textlint: {
            transport: "stdio",
            command: "npx",
            args: ["textlint", "--mcp"],
            // 再起動設定
            restart: {
              enabled: true,
              maxAttempts: 3,
              delayMs: 1000,
            },
          }
        }
      });
      
      // MCPツールを取得
      const tools = await this.mcpClient.getTools();
      console.log(`✓ MCP tools loaded: ${tools.map(t => t.name).join(', ')}`);
      
      // textlint関連のツールを探す
      this.textlintTool = tools.find(tool => 
        tool.name.includes('textlint') || 
        tool.name.includes('lint') ||
        tool.description.toLowerCase().includes('lint')
      ) || null;
      
      if (this.textlintTool) {
        console.log(`✓ textlint tool found: ${this.textlintTool.name}`);
        console.log(`  Description: ${this.textlintTool.description}`);
      } else {
        console.warn("⚠ textlint tool not found in MCP tools");
        console.log("Available tools:", tools.map(t => `${t.name}: ${t.description}`));
      }
    } catch (error) {
      console.error("MCP initialization failed:", error);
      console.log("Continuing without MCP校正...");
    }
  }

  // テキストをtextlintで校正
  async proofreadWithTextlint(text: string, filePath?: string): Promise<{ correctedText: string; hadErrors: boolean }> {
    if (!this.textlintTool) {
      console.log("textlint tool not available, skipping proofreading");
      return { correctedText: text, hadErrors: false };
    }

    try {
      console.log("📝 textlintで校正中...");
      
      // 一時ファイルに保存してからtextlintを実行
      const tempFilePath = filePath || `/tmp/textlint_temp_${Date.now()}.md`;
      await fs.writeFile(tempFilePath, text, 'utf-8');
      
      // textlintツールを呼び出し
      const result = await this.textlintTool.invoke({ 
        file_path: tempFilePath,
        content: text 
      });

      // 一時ファイルをクリーンアップ
      if (!filePath) {
        try {
          await fs.unlink(tempFilePath);
        } catch (e) {
          // ファイル削除エラーは無視
        }
      }

      // 結果の解析
      let lintResults;
      if (typeof result === 'string') {
        try {
          lintResults = JSON.parse(result);
        } catch {
          lintResults = { messages: [], success: true };
        }
      } else {
        lintResults = result;
      }

      const errors = lintResults.messages || lintResults.errors || [];
      const hasErrors = errors.length > 0;

      if (!hasErrors) {
        console.log("✓ 校正エラーなし");
        return { correctedText: text, hadErrors: false };
      }

      console.log(`⚠ ${errors.length}個の校正エラーを検出`);
      
      // エラー詳細を表示
      for (const error of errors) {
        console.log(`  - Line ${error.line || '?'}: ${error.message} (${error.ruleId || 'unknown'})`);
      }

      // LLMで修正
      const correctedText = await this.correctTextWithLLM(text, errors);
      return { correctedText, hadErrors: true };

    } catch (error) {
      console.error("Proofreading failed:", error);
      return { correctedText: text, hadErrors: false };
    }
  }

  // LLMでtextlintのエラーを修正
  private async correctTextWithLLM(text: string, errors: any[]): Promise<string> {
    const chain = this.proofreadPrompt.pipe(this.llm).pipe(new StringOutputParser());

    // エラー情報をフォーマット
    const errorSummary = errors.map(error => 
      `行${error.line || '?'}列${error.column || '?'}: ${error.message} (ルール: ${error.ruleId || 'unknown'})`
    ).join('\n');

    try {
      console.log("🤖 LLMで校正エラーを修正中...");
      const result = await chain.invoke({
        original_text: text,
        lint_errors: errorSummary
      });

      // 行数チェック
      const originalLines = text.split('\n');
      const correctedLines = result.split('\n');
      
      if (originalLines.length !== correctedLines.length) {
        console.warn(`警告: 校正後の行数が一致しません (元: ${originalLines.length}, 修正後: ${correctedLines.length})`);
        return text; // 元のテキストを返す
      }

      console.log("✓ 校正完了");
      return result;
    } catch (error) {
      console.error("LLM correction failed:", error);
      return text;
    }
  }

  // 行情報を解析
  private analyzeLines(text: string): LineInfo[] {
    const lines = text.split('\n');
    const lineInfos: LineInfo[] = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // コードブロックの判定
      if (trimmedLine.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }

      const lineInfo: LineInfo = {
        content: line,
        lineNumber: i + 1,
        isInCodeBlock: inCodeBlock,
        isEmpty: trimmedLine === '',
        isHeading: /^#{1,6}\s/.test(trimmedLine),
        needsTranslation: !inCodeBlock && trimmedLine !== '' && this.containsEnglish(line)
      };

      lineInfos.push(lineInfo);
    }

    return lineInfos;
  }

  // 英語が含まれているかチェック
  private containsEnglish(text: string): boolean {
    // 英語の文字が含まれているかの簡単な判定
    return /[a-zA-Z]/.test(text);
  }

  // 行を翻訳可能なチャンクにグループ化
  private groupLinesIntoChunks(lineInfos: LineInfo[]): Array<{ lines: LineInfo[]; metadata: ChunkMetadata }> {
    const chunks: Array<{ lines: LineInfo[]; metadata: ChunkMetadata }> = [];
    let currentLines: LineInfo[] = [];
    let chunkIndex = 0;

    for (const lineInfo of lineInfos) {
      // 行数制限チェック
      if (currentLines.length >= this.maxLines && currentLines.length > 0) {
        // 現在のチャンクを確定
        chunks.push(this.createLineChunk(currentLines, chunkIndex++));
        currentLines = [lineInfo];
      } else {
        currentLines.push(lineInfo);
      }
    }

    // 最後のチャンクを追加
    if (currentLines.length > 0) {
      chunks.push(this.createLineChunk(currentLines, chunkIndex++));
    }

    // チャンク総数を更新
    return chunks.map((chunk, index) => ({
      ...chunk,
      metadata: { ...chunk.metadata, totalChunks: chunks.length }
    }));
  }

  // 行チャンクを作成
  private createLineChunk(lines: LineInfo[], index: number): { lines: LineInfo[]; metadata: ChunkMetadata } {
    const hasCodeBlocks = lines.some(l => l.isInCodeBlock);
    const headingLevel = Math.max(...lines.filter(l => l.isHeading).map(l => (l.content.match(/^#+/) || [''])[0].length), 0);

    return {
      lines,
      metadata: {
        index,
        totalChunks: 0,
        hasCodeBlocks,
        headingLevel,
        startLine: lines[0].lineNumber,
        endLine: lines[lines.length - 1].lineNumber
      }
    };
  }

  // 翻訳チェーンを実行（行数保証）
  async translateLineChunk(chunk: { lines: LineInfo[]; metadata: ChunkMetadata }): Promise<string[]> {
    // 翻訳が必要ない行（空行、コードブロック内、日本語のみ）はそのまま返す
    const nonTranslatableLines = chunk.lines.filter(l => !l.needsTranslation);
    if (nonTranslatableLines.length === chunk.lines.length) {
      return chunk.lines.map(l => l.content);
    }

    const chain = this.translatePrompt.pipe(this.llm).pipe(new StringOutputParser());
    const linesContent = chunk.lines.map(l => l.content).join('\n');
    
    try {
      console.log(`  - 行番号: ${chunk.metadata.startLine}-${chunk.metadata.endLine}`);
      console.log(`  - 行数: ${chunk.lines.length}`);
      console.log(`  - 翻訳対象行数: ${chunk.lines.filter(l => l.needsTranslation).length}/${chunk.lines.length}`);
      
      const result = await chain.invoke({
        start_line: chunk.metadata.startLine,
        end_line: chunk.metadata.endLine,
        lines_content: linesContent
      });
      
      // 結果を行に分割
      const translatedLines = result.split('\n');
      
      // 行数チェック
      if (translatedLines.length !== chunk.lines.length) {
        console.warn(`警告: 行数が一致しません (期待: ${chunk.lines.length}, 実際: ${translatedLines.length})`);
        console.warn('元の行をそのまま使用します');
        return chunk.lines.map(l => l.content);
      }
      
      return translatedLines;
      
    } catch (error) {
      console.error(`翻訳エラー (行 ${chunk.metadata.startLine}-${chunk.metadata.endLine}): ${error}`);
      return chunk.lines.map(l => l.content);
    }
  }

  // Markdownファイルを読み込み
  async readMarkdownFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`ファイル読み込みエラー: ${error}`);
    }
  }

  // メイン翻訳処理（行数保証 + 校正機能付き）
  async translateMarkdown(inputPath: string, outputPath?: string, enableProofreading: boolean = true): Promise<string> {
    console.log(`翻訳開始: ${inputPath}`);

    // MCPクライアントの初期化
    if (enableProofreading) {
      await this.initializeMCP();
    }

    // ファイル読み込み
    const originalContent = await this.readMarkdownFile(inputPath);
    const originalLines = originalContent.split('\n');
    console.log(`ファイルサイズ: ${originalContent.length} 文字`);
    console.log(`総行数: ${originalLines.length} 行`);
    
    // 行情報を解析
    const lineInfos = this.analyzeLines(originalContent);
    const translatableLines = lineInfos.filter(l => l.needsTranslation).length;
    console.log(`翻訳対象行数: ${translatableLines}/${lineInfos.length} 行`);
    
    // 行をチャンクにグループ化
    const chunks = this.groupLinesIntoChunks(lineInfos);
    console.log(`${chunks.length}個のチャンクに分割しました`);

    // 各チャンクを翻訳
    const allTranslatedLines: string[] = [];
    for (const chunk of chunks) {
      console.log(`\nチャンク ${chunk.metadata.index + 1}/${chunks.length} を翻訳中...`);
      const translatedLines = await this.translateLineChunk(chunk);
      
      // 翻訳後の校正（チャンクごと）
      if (enableProofreading && this.textlintTool) {
        const chunkText = translatedLines.join('\n');
        const { correctedText, hadErrors } = await this.proofreadWithTextlint(chunkText);
        
        if (hadErrors) {
          const correctedLines = correctedText.split('\n');
          // 行数の最終確認
          if (correctedLines.length === translatedLines.length) {
            allTranslatedLines.push(...correctedLines);
            console.log("✓ 校正結果を適用");
          } else {
            console.warn("校正後の行数が一致しないため、翻訳結果をそのまま使用");
            allTranslatedLines.push(...translatedLines);
          }
        } else {
          allTranslatedLines.push(...translatedLines);
        }
      } else {
        allTranslatedLines.push(...translatedLines);
      }
      
      // APIレート制限対策で待機
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 行数の最終確認
    if (allTranslatedLines.length !== originalLines.length) {
      throw new Error(`致命的エラー: 翻訳後の行数が一致しません (元: ${originalLines.length}, 翻訳後: ${allTranslatedLines.length})`);
    }

    const translatedContent = allTranslatedLines.join('\n');
    console.log(`翻訳完了: 行数 ${originalLines.length} -> ${allTranslatedLines.length} (一致: ✓)`);

    // 最終的な全体校正（オプション）
    let finalContent = translatedContent;
    if (enableProofreading && this.textlintTool) {
      console.log("\n📝 最終校正を実行中...");
      const { correctedText, hadErrors } = await this.proofreadWithTextlint(translatedContent, outputPath);
      if (hadErrors) {
        const finalLines = correctedText.split('\n');
        if (finalLines.length === originalLines.length) {
          finalContent = correctedText;
          console.log("✓ 最終校正完了");
        } else {
          console.warn("最終校正で行数が変わったため、校正前の結果を使用");
        }
      }
    }

    // ファイル保存
    if (outputPath) {
      await this.saveTranslatedFile(outputPath, finalContent);
      console.log(`保存完了: ${outputPath}`);
    }

    // MCPクライアントのクリーンアップ
    if (this.mcpClient) {
      try {
        // MultiServerMCPClientのクリーンアップ
        await this.mcpClient.close();
      } catch (error) {
        console.warn("MCP client cleanup warning:", error);
      }
    }

    return finalContent;
  }

  // 翻訳結果を保存
  async saveTranslatedFile(outputPath: string, content: string): Promise<void> {
    try {
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(outputPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`ファイル保存エラー: ${error}`);
    }
  }

  // 最大行数を動的に調整
  setMaxLines(maxLines: number): void {
    this.maxLines = maxLines;
    console.log(`最大行数を ${maxLines} に設定しました`);
  }
}

// 使用例とコマンドライン引数処理
function printUsage() {
  console.log(`
Markdown翻訳ツール

使用方法:
  tsx src/index.ts [options] <input> [output]

引数:
  input               入力Markdownファイル
  output              出力ファイル（省略時は自動生成）

オプション:
  --max-lines <num>   1チャンクあたりの最大行数（デフォルト: 100）
  --no-proofreading   textlintによる校正を無効化
  --help, -h          このヘルプを表示

例:
  tsx src/index.ts README.md
  tsx src/index.ts README.md README_ja.md
  tsx src/index.ts large-doc.md --max-lines 50
  tsx src/index.ts doc.md --no-proofreading
`);
}

async function main() {
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        'max-lines': {
          type: 'string',
          default: '100'
        },
        'no-proofreading': {
          type: 'boolean',
          default: false
        },
        help: {
          type: 'boolean',
          short: 'h'
        }
      },
      allowPositionals: true
    });

    if (values.help || positionals.length === 0) {
      printUsage();
      return;
    }

    const maxLines = parseInt(values['max-lines'] as string, 10);
    if (isNaN(maxLines) || maxLines <= 0) {
      console.error('エラー: --max-linesには正の数値を指定してください');
      return;
    }

    const translator = new MarkdownTranslator(maxLines);
    const inputPath = positionals[0];
    let outputPath = positionals[1];
    
    // 出力ファイル名が指定されていない場合は自動生成
    if (!outputPath) {
      const parsedPath = path.parse(inputPath);
      outputPath = path.join(parsedPath.dir, `${parsedPath.name}_ja${parsedPath.ext}`);
    }
    
    const enableProofreading = !values['no-proofreading'];
    
    console.log(`翻訳開始: ${inputPath} -> ${outputPath}`);
    console.log(`最大行数: ${maxLines}`);
    console.log(`校正機能: ${enableProofreading ? '有効' : '無効'}`);
    
    await translator.translateMarkdown(inputPath, outputPath, enableProofreading);

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unknown option')) {
      console.error('エラー: 不明なオプションです');
      printUsage();
      process.exit(1);
    }
    
    console.error('翻訳処理でエラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  main();
}

export { MarkdownTranslator };