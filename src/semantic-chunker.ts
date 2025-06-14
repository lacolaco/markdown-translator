import type { ChunkInfo } from './types';

/**
 * Splits Markdown content into semantic chunks based on heading boundaries (H1-H3)
 * @param content - The markdown content to split
 * @returns Promise resolving to array of chunk information
 */
export async function chunkMarkdown(content: string): Promise<ChunkInfo[]> {
  const lines = content.split('\n');
  const chunks: ChunkInfo[] = [];
  let currentChunkLines: string[] = [];
  let currentStartLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // 見出しレベル1-3をチェック
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);

    if (headingMatch && currentChunkLines.length > 0) {
      // 新しい見出しが見つかった場合、現在のチャンクを確定
      const endLine = currentStartLine + currentChunkLines.length - 1;
      chunks.push(
        createChunkInfo(currentChunkLines, currentStartLine, endLine)
      );

      // 新しいチャンクを開始
      currentChunkLines = [line];
      currentStartLine = lineNumber;
    } else {
      // 現在のチャンクに追加
      currentChunkLines.push(line);
    }
  }

  // 最後のチャンクを追加
  if (currentChunkLines.length > 0) {
    const endLine = currentStartLine + currentChunkLines.length - 1;
    chunks.push(createChunkInfo(currentChunkLines, currentStartLine, endLine));
  }

  return chunks;
}

/**
 * Creates a ChunkInfo object from lines and position information
 * @param lines - Array of lines that make up the chunk
 * @param startLine - Starting line number (1-indexed)
 * @param endLine - Ending line number (1-indexed)
 * @returns ChunkInfo object with metadata
 */
function createChunkInfo(
  lines: string[],
  startLine: number,
  endLine: number
): ChunkInfo {
  // 元のテキストの行構造を完全に保持
  const content = lines.join('\n');
  const hasCodeBlocks = content.includes('```');
  const needsTranslation = shouldTranslateChunk(content);

  return {
    content,
    startLine,
    endLine,
    hasCodeBlocks,
    needsTranslation,
  };
}

/**
 * Determines whether a chunk needs translation based on its content
 * @param content - The chunk content to analyze
 * @returns true if the chunk contains translatable text
 */
function shouldTranslateChunk(content: string): boolean {
  // コードブロックのみの場合は翻訳しない
  const lines = content.split('\n');
  let inCodeBlock = false;
  let hasTranslatableContent = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (!inCodeBlock && trimmed !== '') {
      // 英語が含まれているかチェック
      if (/[a-zA-Z]/.test(line)) {
        hasTranslatableContent = true;
        break;
      }
    }
  }

  return hasTranslatableContent;
}

/**
 * Calculates statistics for an array of chunks
 * @param chunks - Array of ChunkInfo objects to analyze
 * @returns Statistics object with chunk metrics
 */
export function getChunkStats(chunks: ChunkInfo[]): {
  totalChunks: number;
  translatableChunks: number;
  averageSize: number;
  maxSize: number;
} {
  const stats = {
    totalChunks: chunks.length,
    translatableChunks: chunks.filter(c => c.needsTranslation).length,
    averageSize: 0,
    maxSize: 0,
  };

  if (chunks.length > 0) {
    const sizes = chunks.map(c => c.content.length);
    stats.averageSize = Math.round(
      sizes.reduce((a, b) => a + b, 0) / chunks.length
    );
    stats.maxSize = Math.max(...sizes);
  }

  return stats;
}
