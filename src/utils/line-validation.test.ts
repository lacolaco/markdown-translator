import { describe, it, expect } from 'vitest';
import {
  analyzeLines,
  compareLineCounts,
  getLineCount,
  formatLineCountMessage,
  validateLineCount,
} from './line-validation';

describe('Line Utils', () => {
  describe('analyzeLines', () => {
    it('should analyze basic text correctly', () => {
      const text = 'line1\nline2\nline3';
      const result = analyzeLines(text);

      expect(result.content).toBe(text);
      expect(result.lineCount).toBe(3);
      expect(result.lines).toEqual(['line1', 'line2', 'line3']);
      expect(result.endsWithNewline).toBe(false);
    });

    it('should detect text ending with newline', () => {
      const text = 'line1\nline2\n';
      const result = analyzeLines(text);

      expect(result.lineCount).toBe(3);
      expect(result.lines).toEqual(['line1', 'line2', '']);
      expect(result.endsWithNewline).toBe(true);
    });

    it('should handle empty text', () => {
      const text = '';
      const result = analyzeLines(text);

      expect(result.lineCount).toBe(1);
      expect(result.lines).toEqual(['']);
      expect(result.endsWithNewline).toBe(false);
    });

    it('should handle single line', () => {
      const text = 'single line';
      const result = analyzeLines(text);

      expect(result.lineCount).toBe(1);
      expect(result.lines).toEqual(['single line']);
      expect(result.endsWithNewline).toBe(false);
    });
  });

  describe('compareLineCounts', () => {
    it('should compare equal line counts', () => {
      const original = 'line1\nline2\nline3';
      const processed = 'ライン1\nライン2\nライン3';
      const result = compareLineCounts(original, processed);

      expect(result.originalCount).toBe(3);
      expect(result.processedCount).toBe(3);
      expect(result.difference).toBe(0);
      expect(result.isEqual).toBe(true);
    });

    it('should compare when processed has more lines', () => {
      const original = 'line1\nline2';
      const processed = 'ライン1\nライン2\nライン3';
      const result = compareLineCounts(original, processed);

      expect(result.originalCount).toBe(2);
      expect(result.processedCount).toBe(3);
      expect(result.difference).toBe(1);
      expect(result.isEqual).toBe(false);
    });

    it('should compare when processed has fewer lines', () => {
      const original = 'line1\nline2\nline3';
      const processed = 'ライン1\nライン2';
      const result = compareLineCounts(original, processed);

      expect(result.originalCount).toBe(3);
      expect(result.processedCount).toBe(2);
      expect(result.difference).toBe(-1);
      expect(result.isEqual).toBe(false);
    });
  });

  describe('getLineCount', () => {
    it('should count lines in multi-line text', () => {
      const text = 'line1\nline2\nline3';
      expect(getLineCount(text)).toBe(3);
    });

    it('should count single line', () => {
      const text = 'single line';
      expect(getLineCount(text)).toBe(1);
    });

    it('should count empty text as one line', () => {
      const text = '';
      expect(getLineCount(text)).toBe(1);
    });

    it('should count text with trailing newline', () => {
      const text = 'line1\nline2\n';
      expect(getLineCount(text)).toBe(3);
    });
  });

  describe('formatLineCountMessage', () => {
    it('should format success message when line counts match', () => {
      const original = 'line1\nline2\nline3';
      const processed = 'ライン1\nライン2\nライン3';
      const result = formatLineCountMessage(original, processed, '翻訳');

      expect(result).toBe('翻訳完了');
    });

    it('should format error message when line counts differ', () => {
      const original = 'line1\nline2\nline3';
      const processed = 'ライン1\nライン2';
      const result = formatLineCountMessage(original, processed, '翻訳');

      expect(result).toBe('翻訳後の行数が一致しません (元: 3, 後: 2)');
    });

    it('should work with different contexts', () => {
      const original = 'line1\nline2';
      const processed = 'ライン1\nライン2\nライン3';
      const result = formatLineCountMessage(original, processed, '校正');

      expect(result).toBe('校正後の行数が一致しません (元: 2, 後: 3)');
    });
  });

  describe('validateLineCount', () => {
    it('should return valid when line counts match exactly', () => {
      const original = 'line1\nline2\nline3';
      const translated = 'ライン1\nライン2\nライン3';

      const result = validateLineCount(original, translated);

      expect(result.isValid).toBe(true);
      expect(result.adjustedText).toBe(translated);
    });

    it('should handle trailing newline removal when translated has extra line', () => {
      const original = 'line1\nline2';
      const translated = 'ライン1\nライン2\n';

      const result = validateLineCount(original, translated);

      expect(result.isValid).toBe(true);
      expect(result.adjustedText).toBe('ライン1\nライン2');
    });

    it('should handle newline addition when original has more lines', () => {
      const original = 'line1\nline2\n';
      const translated = 'ライン1\nライン2';

      const result = validateLineCount(original, translated);

      expect(result.isValid).toBe(true);
      expect(result.adjustedText).toBe('ライン1\nライン2\n');
    });

    it('should return invalid when line counts cannot be adjusted', () => {
      const original = 'line1\nline2\nline3';
      const translated = 'ライン1\nライン2\nライン3\nライン4\nライン5';

      const result = validateLineCount(original, translated);

      expect(result.isValid).toBe(false);
      expect(result.adjustedText).toBe(translated);
    });

    it('should handle single line text correctly', () => {
      const original = 'single line';
      const translated = 'シングルライン';

      const result = validateLineCount(original, translated);

      expect(result.isValid).toBe(true);
      expect(result.adjustedText).toBe(translated);
    });

    it('should handle empty text correctly', () => {
      const original = '';
      const translated = '';

      const result = validateLineCount(original, translated);

      expect(result.isValid).toBe(true);
      expect(result.adjustedText).toBe('');
    });

    it('should handle text with only newlines', () => {
      const original = '\n\n\n';
      const translated = '\n\n\n';

      const result = validateLineCount(original, translated);

      expect(result.isValid).toBe(true);
      expect(result.adjustedText).toBe(translated);
    });

    it('should prioritize exact match over adjustments', () => {
      const original = 'line1\nline2';
      const translated = 'ライン1\nライン2';

      const result = validateLineCount(original, translated);

      expect(result.isValid).toBe(true);
      expect(result.adjustedText).toBe(translated);
      expect(result.adjustedText).not.toContain('\n\n');
    });
  });
});
