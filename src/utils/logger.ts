/**
 * Standardized logging utilities
 * Provides consistent formatting and emoji usage across the codebase
 */

import * as path from 'path';

export class Logger {
  /**
   * General information message
   */
  static info(message: string, ...args: any[]): void {
    console.log(`ℹ️  ${message}`, ...args);
  }

  /**
   * Success message with checkmark
   */
  static success(message: string, ...args: any[]): void {
    console.log(`✅ ${message}`, ...args);
  }

  /**
   * Warning message
   */
  static warning(message: string, ...args: any[]): void {
    console.warn(`⚠️  ${message}`, ...args);
  }

  /**
   * Error message
   */
  static error(message: string, ...args: any[]): void {
    console.error(`❌ ${message}`, ...args);
  }

  /**
   * Statistics or metrics display
   */
  static stats(label: string, value: number | string): void {
    console.log(`📊 ${label}: ${value}`);
  }

  /**
   * Debug file output notification
   */
  static debug(filePath: string, description: string): void {
    console.log(`📄 ${description}: ${path.basename(filePath)}`);
  }

  /**
   * Processing step indicator
   */
  static step(message: string): void {
    console.log(`🔄 ${message}`);
  }

  /**
   * Completion indicator for sub-steps
   */
  static substep(message: string): void {
    console.log(`  ✅ ${message}`);
  }

  /**
   * Sub-warning for nested operations
   */
  static subwarning(message: string): void {
    console.warn(`  ⚠️ ${message}`);
  }
}
