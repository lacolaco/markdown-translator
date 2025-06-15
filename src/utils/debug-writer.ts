import * as path from 'path';
import { Logger } from './logger';
import { writeTextFile, ensureDirectory, removeDirectory } from './file-io';

export class DebugFileWriter {
  private debugDir: string;
  private enabled: boolean;

  constructor(debugDir: string = 'tmp', enabled: boolean = true) {
    this.debugDir = path.isAbsolute(debugDir)
      ? debugDir
      : path.join(process.cwd(), debugDir);
    this.enabled = enabled;
  }

  async initialize(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // Clear and recreate debug directory for each run
      await removeDirectory(this.debugDir);
      await ensureDirectory(this.debugDir);
      Logger.info(`Debug logs will be saved to: ${this.debugDir}`);
    } catch (error) {
      Logger.warning('Failed to initialize debug directory:', error);
    }
  }

  async writeOriginalContent(content: string): Promise<void> {
    if (!this.enabled) return;
    const filePath = path.join(this.debugDir, '01-original.md');
    await this.writeFile(filePath, content, '元ファイル');
  }

  async writeChunkInput(
    chunkIndex: number,
    originalContent: string
  ): Promise<void> {
    if (!this.enabled) return;
    const filePath = path.join(
      this.debugDir,
      `02-chunk-${(chunkIndex + 1).toString().padStart(3, '0')}-input.md`
    );
    await this.writeFile(
      filePath,
      originalContent,
      `チャンク${chunkIndex + 1}入力`
    );
  }

  async writeChunkTranslated(
    chunkIndex: number,
    translatedContent: string
  ): Promise<void> {
    if (!this.enabled) return;
    const filePath = path.join(
      this.debugDir,
      `02-chunk-${(chunkIndex + 1).toString().padStart(3, '0')}-translated.md`
    );
    await this.writeFile(
      filePath,
      translatedContent,
      `チャンク${chunkIndex + 1}翻訳済み`
    );
  }

  async writeChunkOutput(
    chunkIndex: number,
    finalContent: string
  ): Promise<void> {
    if (!this.enabled) return;
    const filePath = path.join(
      this.debugDir,
      `02-chunk-${(chunkIndex + 1).toString().padStart(3, '0')}-final.md`
    );
    await this.writeFile(
      filePath,
      finalContent,
      `チャンク${chunkIndex + 1}最終`
    );
  }

  async writeFinalResult(content: string): Promise<void> {
    if (!this.enabled) return;
    const filePath = path.join(this.debugDir, '07-final.md');
    await this.writeFile(filePath, content, '最終結果');
  }

  private async writeFile(
    filePath: string,
    content: string,
    description: string
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await writeTextFile(filePath, content);
      Logger.debug(filePath, description);
    } catch (error) {
      Logger.warning(`Failed to write ${description}:`, error);
    }
  }
}
