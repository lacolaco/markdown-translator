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
