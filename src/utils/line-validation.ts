/**
 * Utility functions for line counting and analysis
 * Centralizes common line-related operations used throughout the codebase
 */

export interface LineAnalysis {
  content: string;
  lineCount: number;
  lines: string[];
  endsWithNewline: boolean;
}

export interface LineComparison {
  originalCount: number;
  processedCount: number;
  difference: number;
  isEqual: boolean;
}

/**
 * Analyzes text content and provides line-related information
 * @param text - The text to analyze
 * @returns Line analysis information
 */
export function analyzeLines(text: string): LineAnalysis {
  const lines = text.split('\n');
  return {
    content: text,
    lineCount: lines.length,
    lines,
    endsWithNewline: text.endsWith('\n'),
  };
}

/**
 * Compares line counts between original and processed text
 * @param original - Original text
 * @param processed - Processed text
 * @returns Line count comparison
 */
export function compareLineCounts(
  original: string,
  processed: string
): LineComparison {
  const originalCount = original.split('\n').length;
  const processedCount = processed.split('\n').length;
  return {
    originalCount,
    processedCount,
    difference: processedCount - originalCount,
    isEqual: originalCount === processedCount,
  };
}

/**
 * Gets the line count of a text string
 * @param text - The text to count lines for
 * @returns Number of lines
 */
export function getLineCount(text: string): number {
  return text.split('\n').length;
}

/**
 * Formats a line count message for logging
 * @param original - Original text
 * @param processed - Processed text
 * @param context - Context for the message (e.g., "翻訳", "校正")
 * @returns Formatted message
 */
export function formatLineCountMessage(
  original: string,
  processed: string,
  context: string
): string {
  const comparison = compareLineCounts(original, processed);
  if (comparison.isEqual) {
    return `${context}完了`;
  } else {
    return `${context}後の行数が一致しません (元: ${comparison.originalCount}, 後: ${comparison.processedCount})`;
  }
}

/**
 * Validates and adjusts translated text to match original line count
 * @param originalText - The original text to compare against
 * @param translatedText - The translated text to validate and adjust
 * @returns { isValid: boolean, adjustedText: string } - validation result and adjusted text
 */
export function validateLineCount(
  originalText: string,
  translatedText: string
): { isValid: boolean; adjustedText: string } {
  const originalLines = originalText.split('\n');
  const translatedLines = translatedText.split('\n');

  // If line counts already match, return as valid
  if (originalLines.length === translatedLines.length) {
    return { isValid: true, adjustedText: translatedText };
  }

  // Try removing trailing newline if translated text has extra lines
  if (
    translatedLines.length === originalLines.length + 1 &&
    translatedText.endsWith('\n')
  ) {
    const translatedWithoutNewline = translatedText.slice(0, -1);
    const translatedLinesWithoutNewline = translatedWithoutNewline.split('\n');

    if (originalLines.length === translatedLinesWithoutNewline.length) {
      return { isValid: true, adjustedText: translatedWithoutNewline };
    }
  }

  // Try adding a newline at the end if original text has more lines
  if (originalLines.length === translatedLines.length + 1) {
    const translatedWithNewline = translatedText + '\n';
    const translatedLinesWithNewline = translatedWithNewline.split('\n');

    if (originalLines.length === translatedLinesWithNewline.length) {
      return { isValid: true, adjustedText: translatedWithNewline };
    }
  }

  // Line counts don't match even with adjustment
  return { isValid: false, adjustedText: translatedText };
}
