import { describe, it, expect } from 'vitest';
import { chunkMarkdown } from './semantic-chunker';
import { readFileSync } from 'fs';

describe('SemanticChunker Line Count Preservation', () => {
  it('should preserve total line count when chunking overview.md', async () => {
    // Read the actual overview.md file
    const content = readFileSync('fixtures/overview.md', 'utf8');
    const originalLines = content.split('\n');

    console.log('=== Overview.md Chunking Analysis ===');
    console.log('Original file line count:', originalLines.length);
    console.log('Original file ends with newline:', content.endsWith('\n'));

    // Chunk the content
    const chunks = await chunkMarkdown(content);

    console.log('\n=== Chunks Detailed Analysis ===');
    console.log('Number of chunks:', chunks.length);

    let totalExpectedLines = 0;
    let totalActualLines = 0;

    chunks.forEach((chunk, i) => {
      const expectedLines = chunk.endLine - chunk.startLine + 1;
      const actualLines = chunk.content.split('\n').length;

      totalExpectedLines += expectedLines;
      totalActualLines += actualLines;

      console.log(`Chunk ${i + 1}:`);
      console.log(
        `  Range: lines ${chunk.startLine}-${chunk.endLine} (${expectedLines} lines expected)`
      );
      console.log(`  Actual content lines: ${actualLines}`);
      console.log(`  Match: ${expectedLines === actualLines ? '✅' : '❌'}`);
      console.log(
        `  Content ends with newline: ${chunk.content.endsWith('\n')}`
      );

      if (expectedLines !== actualLines) {
        console.log(
          `  ⚠️ Line count mismatch! Expected ${expectedLines}, got ${actualLines}`
        );
        console.log(
          `  Content preview: ${JSON.stringify(chunk.content.substring(0, 100))}...`
        );
      }
    });

    console.log('\n=== Summary ===');
    console.log('Original file lines:', originalLines.length);
    console.log('Total expected lines from chunks:', totalExpectedLines);
    console.log('Total actual lines in chunks:', totalActualLines);
    console.log(
      'Expected vs actual difference:',
      totalExpectedLines - totalActualLines
    );
    console.log(
      'Original vs actual difference:',
      originalLines.length - totalActualLines
    );

    // The total lines in all chunks should equal the original file line count
    expect(totalActualLines).toBe(originalLines.length);
  });

  it('should preserve line count with simple test content', async () => {
    const testContent = `# Title

Content line 1.
Content line 2.

## Section 2

More content here.

### Subsection

Final content.`;

    const originalLines = testContent.split('\n');
    const chunks = await chunkMarkdown(testContent);

    const totalChunkLines = chunks.reduce((sum, chunk) => {
      return sum + chunk.content.split('\n').length;
    }, 0);

    expect(totalChunkLines).toBe(originalLines.length);
  });
});
