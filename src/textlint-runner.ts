import { createLinter, loadTextlintrc, loadLinterFormatter } from 'textlint';

type TextlintLinter = ReturnType<typeof createLinter>;
type TextlintResult = Awaited<ReturnType<TextlintLinter['lintFiles']>>[number];
export type TextlintMessage = TextlintResult['messages'][number];

export interface TextlintDiagnostics {
  fixedText: string;
  messages: TextlintMessage[];
  formattedMessage: string;
}

/**
 * Interface for textlint service that can be injected as a dependency
 */
export interface TextlintRunner {
  lintText(text: string): Promise<TextlintDiagnostics>;
  lintFile(filePath: string): Promise<string>;
}

/**
 * Creates a textlint service instance
 * @returns TextlintService implementation
 */
export function createTextlintRunner(): TextlintRunner {
  let cachedLinter: TextlintLinter | null = null;

  const initializeLinter = async (): Promise<TextlintLinter> => {
    if (cachedLinter) {
      return cachedLinter;
    }

    try {
      // Load textlint configuration
      const descriptor = await loadTextlintrc();

      // Create linter instance
      cachedLinter = createLinter({ descriptor });

      return cachedLinter;
    } catch (error) {
      console.warn('⚠️ Textlint の初期化に失敗しました:', error);
      throw error;
    }
  };

  return {
    async lintText(text: string): Promise<TextlintDiagnostics> {
      const linter = await initializeLinter();

      try {
        // Run auto-fix
        const fixResult = await linter.fixText(text, 'temp.md');
        const lintResult = await linter.lintText(fixResult.output, 'temp.md');

        const formatter = await loadLinterFormatter({ formatterName: 'unix' });
        const formattedMessage = formatter.format([lintResult]);

        return {
          fixedText: fixResult.output,
          messages: lintResult.messages,
          formattedMessage,
        };
      } catch (error) {
        throw new Error(`Textlint 実行エラー`, { cause: error });
      }
    },

    async lintFile(filePath: string): Promise<string> {
      const linter = await initializeLinter();

      try {
        const lintResults = await linter.lintFiles([filePath]);
        const formatter = await loadLinterFormatter({
          formatterName: 'stylish',
        });

        return formatter.format(lintResults);
      } catch (error) {
        throw new Error(`Textlint ファイル実行エラー`, { cause: error });
      }
    },
  };
}

// Backward compatibility functions
let defaultService: TextlintRunner | null = null;

function getDefaultService(): TextlintRunner {
  if (!defaultService) {
    defaultService = createTextlintRunner();
  }
  return defaultService;
}

export async function lintFile(filePath: string): Promise<string> {
  return getDefaultService().lintFile(filePath);
}
