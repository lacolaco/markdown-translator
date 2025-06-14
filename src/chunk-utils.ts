import { chunkMarkdown } from './semantic-chunker';

/**
 * Joins chunks while preserving the exact structure
 * Ensures proper chunk boundaries are maintained during concatenation
 * @param chunkContents - Array of chunk content strings
 * @returns Combined text with preserved structure
 */
export function joinChunks(chunkContents: string[]): string {
  if (chunkContents.length === 0) {
    return '';
  }

  if (chunkContents.length === 1) {
    return chunkContents[0];
  }

  // Each chunk from chunkMarkdown already contains its complete internal structure
  // including line breaks. We simply need to join chunks with newline separators
  // to maintain the original line structure between chunks.
  return chunkContents.join('\n');
}

/**
 * Splits markdown content into chunks and rejoins them without any processing
 * This function is useful for testing the chunk pipeline integrity
 * @param content - The markdown content to process
 * @returns Promise resolving to the processed content
 */
export async function processChunkPipeline(content: string): Promise<string> {
  // 1. Split into chunks
  const chunks = await chunkMarkdown(content);

  // 2. Extract chunk contents (no processing)
  const chunkContents = chunks.map(chunk => chunk.content);

  // 3. Rejoin chunks
  return joinChunks(chunkContents);
}

/**
 * Validates that chunk pipeline preserves line count
 * @param originalContent - The original content
 * @param processedContent - The content after chunk pipeline processing
 * @returns Validation result with details
 */
export function validateChunkPipeline(
  originalContent: string,
  processedContent: string
): {
  isValid: boolean;
  originalLines: number;
  processedLines: number;
  difference: number;
} {
  const originalLines = originalContent.split('\n').length;
  const processedLines = processedContent.split('\n').length;
  const difference = processedLines - originalLines;

  return {
    isValid: difference === 0,
    originalLines,
    processedLines,
    difference,
  };
}

/**
 * Gets detailed chunk information for debugging
 * @param content - The content to analyze
 * @returns Promise resolving to chunk analysis
 */
export async function analyzeChunks(content: string): Promise<{
  originalLines: number;
  chunks: Array<{
    index: number;
    lines: number;
    startLine: number;
    endLine: number;
    preview: string;
  }>;
  totalChunkLines: number;
}> {
  const originalLines = content.split('\n').length;
  const chunks = await chunkMarkdown(content);

  const chunkAnalysis = chunks.map((chunk, index) => ({
    index: index + 1,
    lines: chunk.content.split('\n').length,
    startLine: chunk.startLine,
    endLine: chunk.endLine,
    preview:
      chunk.content.substring(0, 50).replace(/\n/g, '\\n') +
      (chunk.content.length > 50 ? '...' : ''),
  }));

  const totalChunkLines = chunkAnalysis.reduce(
    (sum, chunk) => sum + chunk.lines,
    0
  );

  return {
    originalLines,
    chunks: chunkAnalysis,
    totalChunkLines,
  };
}
