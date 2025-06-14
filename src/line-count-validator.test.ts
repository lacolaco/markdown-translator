import { describe, it, expect } from 'vitest';
import { validateLineCount } from './line-count-validator';

describe('Line Count Validator', () => {
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
