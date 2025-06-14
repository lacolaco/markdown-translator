import * as path from 'path';
import * as fs from 'fs/promises';
import { parseArgs } from 'node:util';
import { TranslationWorkflow } from './translation-workflow';

function printUsage() {
  console.log(`
使用方法:
  tsx src/main.ts <入力ファイル> [出力ファイル] [オプション]

オプション:
  -h, --help               このヘルプを表示

例:
  tsx src/main.ts doc.md
  tsx src/main.ts doc.md doc_ja.md
`);
}

async function main() {
  const executeWithWorkflow = async () => {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        help: {
          type: 'boolean',
          default: false,
        },
      },
      allowPositionals: true,
    });

    if (values.help) {
      printUsage();
      return;
    }

    if (positionals.length === 0) {
      console.error('エラー: 入力ファイルを指定してください');
      printUsage();
      return;
    }

    // Validate GOOGLE_API_KEY
    if (!process.env.GOOGLE_API_KEY) {
      console.error('エラー: 環境変数 GOOGLE_API_KEY が設定されていません');
      return;
    }

    const workflow = await TranslationWorkflow.create(
      process.env.GOOGLE_API_KEY
    );
    const inputPath = positionals[0];
    const outputPath =
      positionals[1] ||
      (() => {
        const parsedPath = path.parse(inputPath);
        return path.join(
          parsedPath.dir,
          `${parsedPath.name}_ja${parsedPath.ext}`
        );
      })();

    // 通常の翻訳モード
    console.log(`翻訳開始: ${inputPath} -> ${outputPath}`);

    const content = await fs.readFile(inputPath, 'utf-8');
    const result = await workflow.run({
      content,
      options: {
        maxRetries: 3,
        outputPath,
      },
    });

    await fs.writeFile(outputPath, result.translatedContent, 'utf-8');
    console.log(`\n✅ 翻訳完了: ${outputPath}`);
    console.log(
      `最終確認: ${result.translatedLineCount} 行 (元: ${result.originalLineCount} 行)`
    );
  };

  try {
    await executeWithWorkflow();
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

export { TranslationWorkflow };
