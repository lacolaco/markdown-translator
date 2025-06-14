import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticChunker } from './semantic-chunker';

describe('SemanticChunker', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    chunker = new SemanticChunker(2000);
  });

  describe('chunkMarkdown', () => {
    it('見出しなしのコンテンツを単一のチャンクに分割する', async () => {
      const content = 'This is a simple paragraph.';
      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatchInlineSnapshot(`
        {
          "content": "This is a simple paragraph.",
          "endLine": 1,
          "hasCodeBlocks": false,
          "needsTranslation": true,
          "startLine": 1,
        }
      `);
    });

    it('H1とH2見出しで正しく分割する', async () => {
      const content = `# Main Heading

This is a paragraph under the heading.

## Sub Heading

Another paragraph here.`;

      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks).toHaveLength(2);
      expect(chunks[0].content).toContain('# Main Heading');
      expect(chunks[1].content).toContain('## Sub Heading');
    });

    it('H3見出しでも分割する', async () => {
      const content = `# Level 1

Some content.

## Level 2

More content.

### Level 3

Even more content.

#### Level 4 should not split

This content should be in the same chunk as Level 3.`;

      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toContain('# Level 1');
      expect(chunks[1].content).toContain('## Level 2');
      expect(chunks[2].content).toContain('### Level 3');
      expect(chunks[2].content).toContain('#### Level 4 should not split');
    });

    it('見出しなしのコンテンツはコードブロックも含めて単一チャンクにする', async () => {
      const content = `Here is some code:

\`\`\`javascript
function hello() {
  console.log("Hello World");
}
\`\`\`

And some more text.`;

      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].hasCodeBlocks).toBe(true);
      expect(chunks[0].content).toContain('Here is some code:');
      expect(chunks[0].content).toContain('```javascript');
      expect(chunks[0].content).toContain('And some more text.');
    });

    it('見出しがない場合はリストも単一チャンクにする', async () => {
      const content = `Here are some items:

- First item
- Second item
- Third item

And some text after.`;

      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toContain('Here are some items:');
      expect(chunks[0].content).toContain('- First item');
      expect(chunks[0].content).toContain('And some text after.');
    });





    it('空のコンテンツを処理する', async () => {
      const content = '';
      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('');
      expect(chunks[0].hasCodeBlocks).toBe(false);
      expect(chunks[0].needsTranslation).toBe(false);
    });

    it('空行のみのコンテンツを処理する', async () => {
      const content = '\n\n\n';
      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe('\n\n\n');
      expect(chunks[0].hasCodeBlocks).toBe(false);
      expect(chunks[0].needsTranslation).toBe(false);
    });
  });

  describe('shouldTranslateChunk', () => {
    it('英語が含まれる場合にtrueを返す', async () => {
      const content = 'This is English text.';
      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks[0]).toMatchInlineSnapshot(`
        {
          "content": "This is English text.",
          "endLine": 1,
          "hasCodeBlocks": false,
          "needsTranslation": true,
          "startLine": 1,
        }
      `);
    });

    it('コードのみの場合にfalseを返す', async () => {
      const content = `\`\`\`javascript
console.log("hello");
\`\`\``;
      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks[0]).toMatchInlineSnapshot(`
        {
          "content": "\`\`\`javascript\nconsole.log(\"hello\");\n\`\`\`",
          "endLine": 3,
          "hasCodeBlocks": true,
          "needsTranslation": false,
          "startLine": 1,
        }
      `);
    });

    it('日本語のみの場合にfalseを返す', async () => {
      const content = 'これは日本語のテキストです。';
      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks[0]).toMatchInlineSnapshot(`
        {
          "content": "これは日本語のテキストです。",
          "endLine": 1,
          "hasCodeBlocks": false,
          "needsTranslation": false,
          "startLine": 1,
        }
      `);
    });
  });

  describe('getChunkStats', () => {
    it('チャンクの統計情報を正しく計算する', async () => {
      const content = `# Heading

This is a paragraph.

\`\`\`javascript
code here
\`\`\`

- List item`;

      const chunks = await chunker.chunkMarkdown(content);
      const stats = chunker.getChunkStats(chunks);

      expect(stats.totalChunks).toBe(chunks.length);
      expect(stats.translatableChunks).toBeGreaterThanOrEqual(0);
      expect(stats.averageSize).toBeGreaterThan(0);
      expect(stats.maxSize).toBeGreaterThan(0);
      // Basic statistics validation
    });

    it('空のチャンク配列に対して適切な統計を返す', () => {
      const stats = chunker.getChunkStats([]);

      expect(stats.totalChunks).toBe(0);
      expect(stats.translatableChunks).toBe(0);
      expect(stats.averageSize).toBe(0);
      expect(stats.maxSize).toBe(0);
      // Empty stats should have zero values
    });
  });

  describe('実際のマークダウンファイルでのテスト', () => {
    it('overview.mdのような実際のファイルを正しく見出しで分割する', async () => {
      const content = `# Getting Started

Some introduction content.

## Build AI-powered applications with Genkit

Genkit section content.

### Sub-feature details

Details about sub-features.

## Build with Firebase AI Logic

Firebase section content.

### Configuration steps

Step-by-step guide.`;

      const chunks = await chunker.chunkMarkdown(content);

      expect(chunks).toHaveLength(5);
      expect(chunks[0].content).toContain('# Getting Started');
      expect(chunks[1].content).toContain('## Build AI-powered applications with Genkit');
      expect(chunks[2].content).toContain('### Sub-feature details');
      expect(chunks[3].content).toContain('## Build with Firebase AI Logic');
      expect(chunks[4].content).toContain('### Configuration steps');
    });
  });
});