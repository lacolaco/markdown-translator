import * as fs from 'fs/promises';
import * as path from 'path';

export class DebugLogger {
  private tmpDir: string;

  constructor() {
    this.tmpDir = path.join(process.cwd(), 'tmp');
  }

  async initialize(): Promise<void> {
    try {
      // Clear and recreate debug directory for each run
      await fs.rm(this.tmpDir, { recursive: true, force: true });
      await fs.mkdir(this.tmpDir, { recursive: true });
      console.log(`Debug logs will be saved to: ${this.tmpDir}`);
    } catch (error) {
      console.warn('Failed to initialize debug directory:', error);
    }
  }

  async logOriginalContent(content: string): Promise<void> {
    const filePath = path.join(this.tmpDir, '01-original.md');
    await this.writeFile(filePath, content, '元ファイル');
  }

  async logChunkInput(
    chunkIndex: number,
    originalContent: string
  ): Promise<void> {
    const filePath = path.join(
      this.tmpDir,
      `02-chunk-${(chunkIndex + 1).toString().padStart(3, '0')}-input.md`
    );
    await this.writeFile(
      filePath,
      originalContent,
      `チャンク${chunkIndex + 1}入力`
    );
  }

  async logChunkTranslated(
    chunkIndex: number,
    translatedContent: string
  ): Promise<void> {
    const filePath = path.join(
      this.tmpDir,
      `02-chunk-${(chunkIndex + 1).toString().padStart(3, '0')}-translated.md`
    );
    await this.writeFile(
      filePath,
      translatedContent,
      `チャンク${chunkIndex + 1}翻訳済み`
    );
  }

  async logChunkOutput(
    chunkIndex: number,
    finalContent: string
  ): Promise<void> {
    const filePath = path.join(
      this.tmpDir,
      `02-chunk-${(chunkIndex + 1).toString().padStart(3, '0')}-final.md`
    );
    await this.writeFile(
      filePath,
      finalContent,
      `チャンク${chunkIndex + 1}最終`
    );
  }

  async logFinalResult(content: string): Promise<void> {
    const filePath = path.join(this.tmpDir, '07-final.md');
    await this.writeFile(filePath, content, '最終結果');
  }

  private async writeFile(
    filePath: string,
    content: string,
    description: string
  ): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`📄 ${description}: ${path.basename(filePath)}`);
    } catch (error) {
      console.warn(`Failed to write ${description}:`, error);
    }
  }

  private generateTranslationComparison(
    originalLines: string[],
    translatedLines: string[]
  ): string {
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
