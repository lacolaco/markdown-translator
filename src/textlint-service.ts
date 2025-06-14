import { createLinter, loadTextlintrc, loadLinterFormatter } from 'textlint';

type TextlintLinter = ReturnType<typeof createLinter>;
type TextlintResult = Awaited<ReturnType<TextlintLinter['lintFiles']>>[number];
export type TextlintMessage = TextlintResult['messages'][number];

export interface TextlintDiagnostics {
  fixedText: string;
  messages: TextlintMessage[];
  formattedMessage: string;
}

let cachedLinter: TextlintLinter | null = null;

async function initializeLinter(): Promise<TextlintLinter> {
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
}

export async function getTextlintDiagnostics(
  text: string
): Promise<TextlintDiagnostics> {
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
}
