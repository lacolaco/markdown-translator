import * as path from 'path';
import { parseArgs } from 'node:util';
import { TranslationWorkflow } from './translation-workflow';

function printUsage() {
  console.log(`
使用方法:
  tsx src/main.ts <入力ファイル> [出力ファイル] [オプション]

オプション:
  -d, --debug-chunks       チャンク分割結果のみを表示（翻訳は実行しない）
  -h, --help               このヘルプを表示

例:
  tsx src/main.ts doc.md
  tsx src/main.ts doc.md doc_ja.md
  tsx src/main.ts doc.md --debug-chunks
`);
}

async function main() {
  const executeWithWorkflow = async () => {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        'debug-chunks': {
          type: 'boolean',
          default: false,
        },
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

    const workflow = await TranslationWorkflow.create();
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

    const debugChunks = values['debug-chunks'] as boolean;

    if (debugChunks) {
      // チャンク分割デバッグモード
      await workflow.debugChunks(inputPath);
    } else {
      // 通常の翻訳モード
      console.log(`翻訳開始: ${inputPath} -> ${outputPath}`);

      await workflow.translateMarkdownFile(inputPath, {
        outputPath,
        maxRetries: 3,
      });
    }
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
