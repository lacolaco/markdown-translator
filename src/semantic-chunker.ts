import type { ChunkInfo } from './types';

export class SemanticChunker {
  constructor(_maxChunkSize: number = 2000) {}

  // Markdownを見出しベースでチャンクに分割（H1-H3レベルまで）
  async chunkMarkdown(content: string): Promise<ChunkInfo[]> {
    const lines = content.split('\n');
    const chunks: ChunkInfo[] = [];
    let currentChunk: string[] = [];
    let currentStartLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // 見出しレベル1-3をチェック
      const headingMatch = line.match(/^(#{1,3})\s+(.+)/);

      if (headingMatch && currentChunk.length > 0) {
        // 新しい見出しが見つかった場合、現在のチャンクを確定
        chunks.push(
          this.createChunkInfo(
            currentChunk,
            currentStartLine,
            lineNumber - 1
          )
        );

        // 新しいチャンクを開始
        currentChunk = [line];
        currentStartLine = lineNumber;
      } else {
        // 現在のチャンクに追加
        currentChunk.push(line);
      }
    }

    // 最後のチャンクを追加
    if (currentChunk.length > 0) {
      chunks.push(
        this.createChunkInfo(
          currentChunk,
          currentStartLine,
          lines.length
        )
      );
    }

    return chunks;
  }


  // ChunkInfoを作成
  private createChunkInfo(
    lines: string[],
    startLine: number,
    endLine: number
  ): ChunkInfo {
    const content = lines.join('\n');
    const hasCodeBlocks = content.includes('```');
    const needsTranslation = this.shouldTranslateChunk(content);

    return {
      content,
      startLine,
      endLine,
      hasCodeBlocks,
      needsTranslation,
    };
  }

  // チャンクが翻訳対象かどうかを判定
  private shouldTranslateChunk(content: string): boolean {
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

  // チャンクの統計情報を取得
  getChunkStats(chunks: ChunkInfo[]): {
    totalChunks: number;
    translatableChunks: number;
    averageSize: number;
    maxSize: number;
  } {
    const stats = {
      totalChunks: chunks.length,
      translatableChunks: chunks.filter((c) => c.needsTranslation).length,
      averageSize: 0,
      maxSize: 0,
    };

    if (chunks.length > 0) {
      const sizes = chunks.map((c) => c.content.length);
      stats.averageSize = Math.round(
        sizes.reduce((a, b) => a + b, 0) / chunks.length
      );
      stats.maxSize = Math.max(...sizes);
    }

    return stats;
  }
}
