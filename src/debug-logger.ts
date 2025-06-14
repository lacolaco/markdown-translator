import * as fs from 'fs/promises';
import * as path from 'path';
import type { ChunkInfo } from './types';

export class DebugLogger {
  private sessionId: string;
  private tmpDir: string;

  constructor() {
    this.sessionId = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    this.tmpDir = path.join(process.cwd(), 'tmp');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tmpDir, { recursive: true });
      console.log(`Debug logs will be saved to: ${this.tmpDir}`);
    } catch (error) {
      console.warn('Failed to create debug directory:', error);
    }
  }

  async logOriginalContent(content: string): Promise<void> {
    const filePath = path.join(this.tmpDir, `${this.sessionId}-01-original.md`);
    await this.writeFile(filePath, content, '元ファイル');
  }

  async logSemanticChunks(chunks: ChunkInfo[]): Promise<void> {
    const summary = {
      total_chunks: chunks.length,
      translatable_chunks: chunks.filter(c => c.needsTranslation).length,
      total_characters: chunks.reduce((sum, c) => sum + c.content.length, 0),
      chunks: chunks.map((chunk, index) => ({
        index: index + 1,
        start_line: chunk.startLine,
        end_line: chunk.endLine,
        char_count: chunk.content.length,
        needs_translation: chunk.needsTranslation,
        has_code_blocks: chunk.hasCodeBlocks,
        preview: chunk.content.substring(0, 100).replace(/\n/g, '\\n') + 
                (chunk.content.length > 100 ? '...' : '')
      }))
    };

    const filePath = path.join(this.tmpDir, `${this.sessionId}-02-chunks.json`);
    await this.writeFile(filePath, JSON.stringify(summary, null, 2), 'チャンク分割結果');

    // Save each chunk content separately
    for (const [index, chunk] of chunks.entries()) {
      const chunkFilePath = path.join(this.tmpDir, `${this.sessionId}-03-chunk-${(index + 1).toString().padStart(3, '0')}.md`);
      await this.writeFile(chunkFilePath, chunk.content, `チャンク${index + 1}`);
    }
  }

  async logTranslatedChunk(
    chunkIndex: number, 
    originalLines: string[], 
    translatedLines: string[]
  ): Promise<void> {
    const comparison = this.generateTranslationComparison(originalLines, translatedLines);
    const filePath = path.join(this.tmpDir, `${this.sessionId}-04-translation-${(chunkIndex + 1).toString().padStart(3, '0')}.txt`);
    await this.writeFile(filePath, comparison, `チャンク${chunkIndex + 1}翻訳結果`);

    // Save translated chunk content
    const translatedContent = translatedLines.join('\n');
    const mdFilePath = path.join(this.tmpDir, `${this.sessionId}-05-translated-${(chunkIndex + 1).toString().padStart(3, '0')}.md`);
    await this.writeFile(mdFilePath, translatedContent, `チャンク${chunkIndex + 1}翻訳済み`);
  }

  async logTranslatedResult(content: string): Promise<void> {
    const filePath = path.join(this.tmpDir, `${this.sessionId}-06-translated-full.md`);
    await this.writeFile(filePath, content, '翻訳完了（校正前）');
  }

  async logFinalResult(content: string): Promise<void> {
    const filePath = path.join(this.tmpDir, `${this.sessionId}-08-final.md`);
    await this.writeFile(filePath, content, '最終結果');
  }

  private async writeFile(filePath: string, content: string, description: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`📄 ${description}: ${path.basename(filePath)}`);
    } catch (error) {
      console.warn(`Failed to write ${description}:`, error);
    }
  }

  private generateTranslationComparison(originalLines: string[], translatedLines: string[]): string {
    const maxLines = Math.max(originalLines.length, translatedLines.length);
    const comparison = ['=== 翻訳前後比較 ===', ''];

    for (const i of Array.from({ length: maxLines }, (_, index) => index)) {
      const lineNum = (i + 1).toString().padStart(3, ' ');
      const original = originalLines[i] || '';
      const translated = translatedLines[i] || '';

      comparison.push(`${lineNum} | ${original}`);
      comparison.push(`${lineNum} > ${translated}`);
      
      if (original !== translated) {
        comparison.push(`${' '.repeat(3)} ! 変更あり`);
      }
      comparison.push('');
    }

    return comparison.join('\n');
  }
}