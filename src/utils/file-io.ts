/**
 * Standardized file I/O utilities
 * Provides consistent file operations across the codebase
 */

import * as fs from 'fs/promises';
import { readFileSync } from 'fs';

/**
 * Reads a text file asynchronously
 * @param filePath - Path to the file
 * @returns Promise resolving to file content
 */
export async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Writes a text file asynchronously
 * @param filePath - Path to the file
 * @param content - Content to write
 * @returns Promise that resolves when write is complete
 */
export async function writeTextFile(
  filePath: string,
  content: string
): Promise<void> {
  return fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Reads a text file synchronously (for tests and simple operations)
 * @param filePath - Path to the file
 * @returns File content
 */
export function readTextFileSync(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath - Path to the directory
 * @returns Promise that resolves when directory exists
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Removes a directory and all its contents
 * @param dirPath - Path to the directory
 * @returns Promise that resolves when directory is removed
 */
export async function removeDirectory(dirPath: string): Promise<void> {
  await fs.rm(dirPath, { recursive: true, force: true });
}

/**
 * Checks if a file exists
 * @param filePath - Path to the file
 * @returns Promise resolving to true if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
