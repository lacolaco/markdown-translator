import * as path from 'path';
import { parseArgs } from 'node:util';
import { TranslationWorkflow } from './translation-workflow';
import { DebugFileWriter } from './utils/debug-writer';
import { Logger } from './utils/logger';
import { readTextFile, writeTextFile } from './utils/file-io';
import { createTextlintRunner } from './textlint-runner';

function printUsage() {
  console.log(`
使用方法:
  tsx src/main.ts <入力ファイル> [出力ファイル] [オプション]

オプション:
  -h, --help               このヘルプを表示
  --debug                  デバッグファイル出力を有効化 (既定値: false)
  --debug-dir <ディレクトリ>   デバッグファイル出力先ディレクトリ (既定値: tmp)
  --instruction-file <ファイル> 翻訳に追加指示を与えるファイル (既定値: translator-instructions.md)

例:
  tsx src/main.ts doc.md
  tsx src/main.ts doc.md doc_ja.md
  tsx src/main.ts doc.md --debug
  tsx src/main.ts doc.md --debug --debug-dir debug-output
  tsx src/main.ts doc.md --instruction-file custom-instructions.md
`);
}

async function loadInstructionsFile(
  instructionFile: string,
  isCustomFile: boolean
): Promise<string> {
  try {
    const content = await readTextFile(instructionFile);
    Logger.info(`追加指示ファイルを読み込みました: ${instructionFile}`);
    return content;
  } catch (error) {
    // Silently ignore if default file doesn't exist, but warn for custom files
    if (isCustomFile) {
      Logger.warning(
        `指定された指示ファイルが見つかりません: ${instructionFile}`
      );
    }
    return '';
  }
}

function getOutputFilePath(
  inputPath: string,
  providedOutputPath?: string
): string {
  if (providedOutputPath) {
    return providedOutputPath;
  }

  const parsedPath = path.parse(inputPath);
  return path.join(parsedPath.dir, `${parsedPath.name}_ja${parsedPath.ext}`);
}

async function main() {
  const executeWithWorkflow = async () => {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        help: { type: 'boolean', default: false },
        debug: { type: 'boolean', default: false },
        'debug-dir': { type: 'string', default: 'tmp' },
        'instruction-file': {
          type: 'string',
          default: 'translator-instructions.md',
        },
      },
      allowPositionals: true,
    });

    if (values.help) {
      printUsage();
      return;
    }

    if (positionals.length === 0) {
      Logger.error('入力ファイルを指定してください');
      printUsage();
      return;
    }

    // Validate GOOGLE_API_KEY
    if (!process.env.GOOGLE_API_KEY) {
      Logger.error('環境変数 GOOGLE_API_KEY が設定されていません');
      return;
    }

    // Read instruction file if it exists
    const instructionFile =
      values['instruction-file'] || 'translator-instructions.md';
    const additionalInstructions = await loadInstructionsFile(
      instructionFile,
      !!values['instruction-file']
    );

    // DebugFileWriterを作成
    const debugFileWriter = new DebugFileWriter(
      values['debug-dir'] || 'tmp',
      values.debug || false
    );

    const textlintRunner = createTextlintRunner();

    const workflow = new TranslationWorkflow(
      process.env.GOOGLE_API_KEY,
      debugFileWriter,
      textlintRunner,
      additionalInstructions
    );
    const inputPath = positionals[0];
    const outputPath = getOutputFilePath(inputPath, positionals[1]);

    Logger.info(`翻訳開始: ${inputPath} -> ${outputPath}`);

    const content = await readTextFile(inputPath);
    const result = await workflow.run({
      content,
      options: { maxRetries: 3 },
    });

    await writeTextFile(outputPath, result.translatedContent);
    Logger.success(`翻訳完了: ${outputPath}`);

    // 校正エラーがあった場合は最終校正チェックを実行
    if (result.hasProofreadErrors) {
      Logger.info('\n🔍 最終校正チェック中...');
      try {
        const finalDiagnostics = await textlintRunner.lintFile(outputPath);
        if (finalDiagnostics.length > 0) {
          Logger.warning(`最終校正エラー:\n ${finalDiagnostics}`);
        }
      } catch (error) {
        Logger.warning('最終校正チェックに失敗:', error);
      }
    }
  };

  try {
    await executeWithWorkflow();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unknown option')) {
      Logger.error('不明なオプションです');
      printUsage();
      process.exit(1);
    }

    Logger.error('翻訳処理でエラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  main();
}
