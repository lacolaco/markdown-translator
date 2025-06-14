import { readFileSync } from 'fs';
import { SemanticChunker } from './src/semantic-chunker.js';

// Read the overview.md file
const filePath = './fixtures/overview.md';
const content = readFileSync(filePath, 'utf-8');

// Create SemanticChunker instance
const chunker = new SemanticChunker();

// Process the file
const chunks = await chunker.chunkMarkdown(content);

// Analyze the results
console.log('=== SEMANTIC CHUNKER ANALYSIS ===');
console.log(`Original file line count: ${content.split('\n').length}`);
console.log(`Number of chunks created: ${chunks.length}`);
console.log('');

let totalLinesInChunks = 0;
let chunkDetails = [];

chunks.forEach((chunk, index) => {
  const chunkLineCount = chunk.content.split('\n').length;
  const expectedLineCount = chunk.endLine - chunk.startLine + 1;

  chunkDetails.push({
    index: index + 1,
    startLine: chunk.startLine,
    endLine: chunk.endLine,
    actualLines: chunkLineCount,
    expectedLines: expectedLineCount,
    discrepancy: chunkLineCount - expectedLineCount,
  });

  totalLinesInChunks += chunkLineCount;

  console.log(`Chunk ${index + 1}:`);
  console.log(
    `  Lines ${chunk.startLine}-${chunk.endLine} (expected: ${expectedLineCount} lines)`
  );
  console.log(`  Actual content lines: ${chunkLineCount}`);
  console.log(`  Discrepancy: ${chunkLineCount - expectedLineCount}`);
  console.log(`  Has code blocks: ${chunk.hasCodeBlocks}`);
  console.log(`  Needs translation: ${chunk.needsTranslation}`);
  console.log('');
});

console.log('=== SUMMARY ===');
console.log(`Original file lines: ${content.split('\n').length}`);
console.log(`Total lines across all chunks: ${totalLinesInChunks}`);
console.log(`Discrepancy: ${totalLinesInChunks - content.split('\n').length}`);

// Check for any chunks with discrepancies
const problematicChunks = chunkDetails.filter(chunk => chunk.discrepancy !== 0);
if (problematicChunks.length > 0) {
  console.log('\n=== PROBLEMATIC CHUNKS ===');
  problematicChunks.forEach(chunk => {
    console.log(
      `Chunk ${chunk.index}: Expected ${chunk.expectedLines}, got ${chunk.actualLines} (diff: ${chunk.discrepancy})`
    );
  });
}

// Let's also examine the first few lines of each chunk to understand the structure
console.log('\n=== CHUNK CONTENT PREVIEW ===');
chunks.forEach((chunk, index) => {
  const lines = chunk.content.split('\n');
  console.log(
    `Chunk ${index + 1} (lines ${chunk.startLine}-${chunk.endLine}):`
  );
  console.log(`  First line: "${lines[0]}"`);
  if (lines.length > 1) {
    console.log(`  Last line: "${lines[lines.length - 1]}"`);
  }
  console.log(`  Total lines in content: ${lines.length}`);
  console.log('');
});
