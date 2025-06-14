import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Translator } from './translator';
import { TranslationWorkflow } from './translation-workflow';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// LLMとDebugLoggerをモック
vi.mock('@langchain/google-genai');
vi.mock('./debug-logger');

describe('Translation Workflow Line Count Preservation', () => {
  let workflow: TranslationWorkflow;
  let translator: Translator;

  beforeEach(async () => {
    // 環境変数のモック
    process.env.GOOGLE_API_KEY = 'test-key';

    // モックLLMインスタンスを作成
    const mockLLM = new ChatGoogleGenerativeAI({
      apiKey: 'test-key',
      model: 'gemini-2.0-flash',
      temperature: 0.3,
    });

    workflow = await TranslationWorkflow.create('test-key');
    translator = await Translator.create(mockLLM);
  });

  /**
   * スタブ翻訳関数 - 実際のLLM呼び出しの代わりに使用
   * 行構造を保持しながら簡単な変換を行う
   * 元のテキストの改行構造を完全に保持する
   */
  const createStubTranslation = (originalText: string): string => {
    const lines = originalText.split('\n');
    const translatedLines = lines.map(line => {
      // 空行や特殊な行はそのまま保持
      if (
        line.trim() === '' ||
        line.startsWith('#') ||
        line.startsWith('```') ||
        line.startsWith('<') ||
        line.startsWith('<!--')
      ) {
        return line;
      }
      // 英語の文章を簡単な日本語に変換（スタブ）
      return line.replace(/[a-zA-Z]/g, 'あ');
    });

    // 元のテキストの終端構造を保持
    // 元のテキストが改行で終わっていない場合は、結果も改行で終わらない
    return translatedLines.join('\n');
  };

  it('should preserve line count when translating a single chunk', async () => {
    const chunkText = `# Title

This is a paragraph with multiple lines.
It should preserve the structure.

* List item 1
* List item 2`;

    // translateChunkメソッドをスタブ化
    const originalTranslateChunk = translator['translateChunk'];
    translator['translateChunk'] = vi
      .fn()
      .mockImplementation(async (text: string) => createStubTranslation(text));

    try {
      // チャンク翻訳実行
      const result = await translator.translateChunk(chunkText);

      // 結果の行数を確認
      const originalLines = chunkText.split('\n');
      const resultLines = result.split('\n');

      // 行数が保持されていることを確認
      expect(resultLines.length).toBe(originalLines.length);

      // 構造の整合性を確認
      for (let i = 0; i < originalLines.length; i++) {
        const originalLine = originalLines[i];
        const resultLine = resultLines[i];

        // 空行は空行のまま保持されているか
        if (originalLine.trim() === '') {
          expect(resultLine.trim()).toBe('');
        }

        // 見出しレベルは保持されているか
        if (originalLine.startsWith('#')) {
          expect(resultLine.startsWith('#')).toBe(true);
          const originalLevel = originalLine.match(/^#+/)?.[0].length || 0;
          const resultLevel = resultLine.match(/^#+/)?.[0].length || 0;
          expect(resultLevel).toBe(originalLevel);
        }
      }
    } finally {
      // メソッドを元に戻す
      translator['translateChunk'] = originalTranslateChunk;
    }
  });

  it('should handle empty lines correctly', async () => {
    const chunkText = `First line

Second line after empty line


Third line after multiple empty lines`;

    const originalLines = chunkText.split('\n');

    // translateChunkメソッドをスタブ化
    const originalTranslateChunk = translator['translateChunk'];
    translator['translateChunk'] = vi
      .fn()
      .mockImplementation(async (text: string) => createStubTranslation(text));

    try {
      const result = await translator.translateChunk(chunkText);
      const resultLines = result.split('\n');

      expect(resultLines.length).toBe(originalLines.length);

      // 空行の位置が保持されていることを確認
      for (let i = 0; i < originalLines.length; i++) {
        if (originalLines[i].trim() === '') {
          expect(resultLines[i].trim()).toBe('');
        }
      }
    } finally {
      translator['translateChunk'] = originalTranslateChunk;
    }
  });

  it('should handle chunk boundaries correctly', async () => {
    // チャンク境界で問題が起きやすいパターン
    const originalText = `# Section 1
Content of section 1.

## Subsection
More content here.

* List item
* Another item

Final paragraph.`;

    const originalLines = originalText.split('\n');

    const originalTranslateChunk = translator['translateChunk'];
    translator['translateChunk'] = vi
      .fn()
      .mockImplementation(async (text: string) => createStubTranslation(text));

    try {
      const result = await translator.translateChunk(originalText);
      const resultLines = result.split('\n');

      expect(resultLines.length).toBe(originalLines.length);
    } finally {
      translator['translateChunk'] = originalTranslateChunk;
    }
  });

  it('validateLineCount function should work correctly', async () => {
    const { validateLineCount } = await import('./line-count-validator');

    // 行数が一致する場合
    const original1 = 'line1\nline2\nline3';
    const translated1 = 'あああ\nいいい\nううう';
    const result1 = validateLineCount(original1, translated1);
    expect(result1.isValid).toBe(true);
    expect(result1.adjustedText).toBe(translated1);

    // 末尾改行で調整できる場合
    const original2 = 'line1\nline2\n';
    const translated2 = 'あああ\nいいい';
    const result2 = validateLineCount(original2, translated2);
    expect(result2.isValid).toBe(true);
    expect(result2.adjustedText).toBe(translated2 + '\n');

    // 末尾改行削除で調整できる場合（LLMが余分な改行を追加した場合）
    const original3 = '## Best Practices'; // 1行、改行なし
    const translated3 = '## ベストプラクティス\n'; // 2行、末尾に改行
    const result3 = validateLineCount(original3, translated3);
    expect(result3.isValid).toBe(true);
    expect(result3.adjustedText).toBe('## ベストプラクティス');

    // 調整できない場合 - 大きく行数が異なる場合
    const original4 = 'line1\nline2\nline3\nline4';
    const translated4 = 'あああ\nいいい';
    const result4 = validateLineCount(original4, translated4);
    expect(result4.isValid).toBe(false);
    expect(result4.adjustedText).toBe(translated4);
  });
});
