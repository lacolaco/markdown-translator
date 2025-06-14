import { describe, it, expect } from 'vitest';
import {
  joinChunks,
  processChunkPipeline,
  validateChunkPipeline,
  analyzeChunks,
} from './chunk-utils';
import * as fs from 'fs/promises';

describe('Chunk Utils', () => {
  describe('joinChunks', () => {
    it('should return empty string for empty array', () => {
      const result = joinChunks([]);
      expect(result).toBe('');
    });

    it('should return single chunk as-is', () => {
      const chunks = ['Single chunk content'];
      const result = joinChunks(chunks);
      expect(result).toBe('Single chunk content');
    });

    it('should join multiple chunks with proper boundaries', () => {
      const chunks = [
        '# First chunk\nContent 1',
        '# Second chunk\nContent 2',
        '# Third chunk\nContent 3',
      ];
      const result = joinChunks(chunks);

      // チャンクが正しく結合されることを確認（余分な空行は追加されない）
      expect(result).toContain('Content 1\n# Second chunk');
      expect(result).toContain('Content 2\n# Third chunk');

      // 行数の確認
      const resultLines = result.split('\n').length;

      // 各チャンクは2行、3つのチャンクで6行
      // join('\n')では '# First chunk\nContent 1\n# Second chunk\nContent 2\n# Third chunk\nContent 3' となる
      expect(resultLines).toBe(6);
    });

    it('should handle chunks that end with newlines', () => {
      const chunks = [
        '# First chunk\nContent 1\n', // 末尾に改行あり
        '# Second chunk\nContent 2', // 末尾に改行なし
      ];
      const result = joinChunks(chunks);

      // 結果に両方のチャンクが含まれることを確認
      expect(result).toContain('# First chunk');
      expect(result).toContain('# Second chunk');
    });
  });

  describe('validateChunkPipeline', () => {
    it('should validate matching line counts', () => {
      const original = 'Line 1\nLine 2\nLine 3';
      const processed = 'Modified 1\nModified 2\nModified 3';

      const validation = validateChunkPipeline(original, processed);

      expect(validation.isValid).toBe(true);
      expect(validation.originalLines).toBe(3);
      expect(validation.processedLines).toBe(3);
      expect(validation.difference).toBe(0);
    });

    it('should detect line count differences', () => {
      const original = 'Line 1\nLine 2\nLine 3';
      const processed = 'Modified 1\nModified 2'; // 1行少ない

      const validation = validateChunkPipeline(original, processed);

      expect(validation.isValid).toBe(false);
      expect(validation.originalLines).toBe(3);
      expect(validation.processedLines).toBe(2);
      expect(validation.difference).toBe(-1);
    });

    it('should handle empty strings', () => {
      const validation = validateChunkPipeline('', '');

      expect(validation.isValid).toBe(true);
      expect(validation.originalLines).toBe(1); // 空文字列は1行扱い
      expect(validation.processedLines).toBe(1);
      expect(validation.difference).toBe(0);
    });
  });

  describe('processChunkPipeline', () => {
    it('should preserve simple markdown structure', async () => {
      const markdown = `# Title

Content paragraph.

## Section

More content.`;

      const result = await processChunkPipeline(markdown);
      const validation = validateChunkPipeline(markdown, result);

      expect(validation.isValid).toBe(true);
      expect(result).toContain('# Title');
      expect(result).toContain('## Section');
    });

    it('should handle single heading', async () => {
      const markdown = '# Single Heading';
      const result = await processChunkPipeline(markdown);
      const validation = validateChunkPipeline(markdown, result);

      expect(validation.isValid).toBe(true);
      expect(result).toBe(markdown);
    });

    it('should preserve code blocks', async () => {
      const markdown = `# Code Example

\`\`\`javascript
function test() {
  return "hello";
}
\`\`\`

End of example.`;

      const result = await processChunkPipeline(markdown);
      const validation = validateChunkPipeline(markdown, result);

      expect(validation.isValid).toBe(true);
      expect(result).toContain('```javascript');
      expect(result).toContain('function test()');
      expect(result).toContain('```');
    });
  });

  describe('analyzeChunks', () => {
    it('should provide accurate chunk analysis', async () => {
      const markdown = `# Title 1

Content for title 1.

## Subsection

Subsection content.

# Title 2

Content for title 2.`;

      const analysis = await analyzeChunks(markdown);

      expect(analysis.originalLines).toBe(markdown.split('\n').length);
      expect(analysis.chunks.length).toBeGreaterThan(0);
      expect(analysis.totalChunkLines).toBe(analysis.originalLines);

      // 各チャンクの詳細をチェック
      analysis.chunks.forEach((chunk, index) => {
        expect(chunk.index).toBe(index + 1);
        expect(chunk.lines).toBeGreaterThan(0);
        expect(chunk.startLine).toBeGreaterThan(0);
        expect(chunk.endLine).toBeGreaterThanOrEqual(chunk.startLine);
        expect(typeof chunk.preview).toBe('string');
      });
    });

    it('should handle single chunk content', async () => {
      const markdown = 'Simple content without headings.';
      const analysis = await analyzeChunks(markdown);

      expect(analysis.originalLines).toBe(1);
      expect(analysis.chunks.length).toBe(1);
      expect(analysis.totalChunkLines).toBe(1);
      expect(analysis.chunks[0].preview).toContain('Simple content');
    });

    it('should truncate long previews', async () => {
      const longContent =
        'A'.repeat(100) + ' more content that should be truncated';
      const markdown = `# Long Content\n\n${longContent}`;

      const analysis = await analyzeChunks(markdown);
      const chunkWithLongContent = analysis.chunks.find(c =>
        c.preview.includes('AAAAAAAAAA')
      );

      expect(chunkWithLongContent).toBeDefined();
      // プレビューが実際に切り詰められていることを確認（元の内容より短い）
      expect(chunkWithLongContent!.preview.length).toBeLessThan(
        longContent.length
      );
      expect(chunkWithLongContent!.preview).toContain('...');
    });
  });

  describe('Pipeline Integration Tests', () => {
    /**
     * チャンク分割→結合パイプラインのテスト（統合テスト）
     * 翻訳や校正は行わず、単純に分割して結合するだけで行数が保持されることを確認
     */
    it('should preserve line count through chunk → join pipeline without any processing', async () => {
      // テスト用のマークダウンテキスト
      const testMarkdown = `# Main Title

This is the introduction paragraph.
It has multiple lines.

## Section 1

Content for section 1.

### Subsection 1.1

More detailed content here.

## Section 2

Content for section 2.

* List item 1
* List item 2
* List item 3

## Section 3

Final section content.

\`\`\`javascript
// Code block that should be preserved
function example() {
  return "hello";
}
\`\`\`

End of document.`;

      console.log(`Original text has ${testMarkdown.split('\n').length} lines`);

      // 新しいユーティリティ関数を使用してパイプラインをテスト
      const processedContent = await processChunkPipeline(testMarkdown);

      // 検証ユーティリティを使用
      const validation = validateChunkPipeline(testMarkdown, processedContent);

      console.log(`Processed text has ${validation.processedLines} lines`);
      console.log(`Line count difference: ${validation.difference}`);

      // 行数が保持されていることを確認
      expect(validation.isValid).toBe(true);
      expect(validation.difference).toBe(0);

      // 内容も基本的に保持されていることを確認
      expect(processedContent).toContain('# Main Title');
      expect(processedContent).toContain('## Section 1');
      expect(processedContent).toContain('## Section 2');
      expect(processedContent).toContain('## Section 3');
      expect(processedContent).toContain('function example()');
    });

    it('should preserve line count with real file (overview.md)', async () => {
      // 実際のファイルを使ったテスト
      const filePath =
        '/Users/lacolaco/works/langchain-sandbox/fixtures/overview.md';

      const originalContent = await fs.readFile(filePath, 'utf-8');
      console.log(
        `Original file has ${originalContent.split('\n').length} lines`
      );

      // 新しいユーティリティ関数を使用
      const processedContent = await processChunkPipeline(originalContent);
      const validation = validateChunkPipeline(
        originalContent,
        processedContent
      );

      console.log(`Processed file has ${validation.processedLines} lines`);
      console.log(`Line count difference: ${validation.difference}`);

      // 行数が保持されていることを確認
      expect(validation.isValid).toBe(true);
      expect(validation.difference).toBe(0);

      // 先頭と末尾の数行が保持されていることを確認
      const originalLines = originalContent.split('\n');
      const processedLines = processedContent.split('\n');

      const originalFirstLines = originalLines.slice(0, 3);
      const processedFirstLines = processedLines.slice(0, 3);
      expect(processedFirstLines).toEqual(originalFirstLines);

      const originalLastLines = originalLines.slice(-3);
      const processedLastLines = processedLines.slice(-3);
      expect(processedLastLines).toEqual(originalLastLines);
    });

    it('should handle edge cases in chunk pipeline', async () => {
      // エッジケースのテスト

      // 空のテキスト
      const emptyText = '';
      const emptyProcessed = await processChunkPipeline(emptyText);
      expect(emptyProcessed).toBe('');

      // 単一行のテキスト
      const singleLine = '# Single Line';
      const singleProcessed = await processChunkPipeline(singleLine);
      const singleValidation = validateChunkPipeline(
        singleLine,
        singleProcessed
      );
      expect(singleValidation.isValid).toBe(true);

      // 見出しがないテキスト
      const noHeadings = `This is just some text.
It has no headings.
Multiple lines but no structure.`;
      const noHeadingProcessed = await processChunkPipeline(noHeadings);
      const noHeadingValidation = validateChunkPipeline(
        noHeadings,
        noHeadingProcessed
      );
      expect(noHeadingValidation.isValid).toBe(true);

      // 末尾が改行で終わるテキスト
      const endsWithNewline = `# Title
Content here.
`;
      const newlineProcessed = await processChunkPipeline(endsWithNewline);
      const newlineValidation = validateChunkPipeline(
        endsWithNewline,
        newlineProcessed
      );
      expect(newlineValidation.isValid).toBe(true);
    });

    it('should provide detailed chunk analysis', async () => {
      // チャンク分析機能のテスト
      const testContent = `# Title 1

Content 1.

## Section 1

More content.

# Title 2

Final content.`;

      const analysis = await analyzeChunks(testContent);

      expect(analysis.originalLines).toBeGreaterThan(0);
      expect(analysis.chunks.length).toBeGreaterThan(0);
      expect(analysis.totalChunkLines).toBe(analysis.originalLines);

      // 各チャンクに必要な情報が含まれていることを確認
      analysis.chunks.forEach(chunk => {
        expect(chunk.index).toBeGreaterThan(0);
        expect(chunk.lines).toBeGreaterThan(0);
        expect(chunk.startLine).toBeGreaterThan(0);
        expect(chunk.endLine).toBeGreaterThanOrEqual(chunk.startLine);
        expect(chunk.preview).toBeTruthy();
      });
    });
  });
});
