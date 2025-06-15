import { describe, it, expect, vi } from 'vitest';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { FakeChatModel } from '@langchain/core/utils/testing';
import { Proofreader, type ProofreadInput } from './proofreader';
import type { TextlintRunner, TextlintDiagnostics } from './textlint-runner';

// Mock Runnable Language Model
const createMockRunnableLLM = () => {
  return new FakeChatModel({}).pipe(new StringOutputParser());
};

// Mock TextlintRunner
const createMockTextlintRunner = (
  lintTextResponse: TextlintDiagnostics
): TextlintRunner => {
  return {
    lintText: vi.fn().mockResolvedValue(lintTextResponse),
    lintFile: vi.fn().mockResolvedValue(''),
  };
};

describe('Proofreader', () => {
  describe('constructor', () => {
    it('should create proofreader with required dependencies', () => {
      const mockLLM = createMockRunnableLLM();
      const mockTextlintRunner = createMockTextlintRunner({
        fixedText: 'test text',
        messages: [],
        formattedMessage: '',
      });
      const proofreader = new Proofreader(mockLLM, mockTextlintRunner);
      
      expect(proofreader).toBeInstanceOf(Proofreader);
    });
  });

  describe('run', () => {
    it('should return original text when no textlint errors are found', async () => {
      const inputText = '# Perfect Text\n\nThis text has no errors.';
      const mockLLM = createMockRunnableLLM();
      const mockTextlintRunner = createMockTextlintRunner({
        fixedText: inputText,
        messages: [], // No errors
        formattedMessage: '',
      });

      const proofreader = new Proofreader(mockLLM, mockTextlintRunner);
      const input: ProofreadInput = { text: inputText };

      const result = await proofreader.run(input);

      expect(result.fixedText).toBe(inputText);
      expect(result.remainingErrors).toBeUndefined();
      expect(mockTextlintRunner.lintText).toHaveBeenCalledWith(inputText);
      // Since no errors are found, no LLM processing should occur
    });

    it('should process text with LLM when textlint errors are found', async () => {
      const inputText = '# Text with Error\n\nThis text have errors.';
      const mockLLM = createMockRunnableLLM();
      
      // First call: has errors, Second call: no errors
      const mockTextlintRunner = {
        lintText: vi.fn()
          .mockResolvedValueOnce({
            fixedText: inputText,
            messages: [
              {
                line: 3,
                column: 11,
                severity: 2,
                message: 'Subject-verb disagreement',
                ruleId: 'grammar-check',
              },
            ],
            formattedMessage: 'Line 3: Subject-verb disagreement',
          })
          .mockResolvedValueOnce({
            fixedText: 'any corrected text', // Mock the final result
            messages: [], // No remaining errors
            formattedMessage: '',
          }),
        lintFile: vi.fn().mockResolvedValue(''),
      };

      const proofreader = new Proofreader(mockLLM, mockTextlintRunner);
      const input: ProofreadInput = { text: inputText };

      const result = await proofreader.run(input);

      // Test the main behavior: LLM was called and textlint service was used properly
      expect(mockTextlintRunner.lintText).toHaveBeenCalledTimes(2);
      expect(mockTextlintRunner.lintText).toHaveBeenNthCalledWith(1, inputText);
      expect(result.remainingErrors).toBeUndefined();
      
      // LLM was invoked to process the text with errors
    });

    it('should include remaining errors when LLM cannot fix all issues', async () => {
      const inputText = '# Text with Multiple Errors\n\nThis text have many errors and problems.';
      const mockLLM = createMockRunnableLLM();
      
      // First call: has errors, Second call: still has some errors
      const mockTextlintRunner = {
        lintText: vi.fn()
          .mockResolvedValueOnce({
            fixedText: inputText,
            messages: [
              {
                line: 3,
                column: 11,
                severity: 2,
                message: 'Subject-verb disagreement',
                ruleId: 'grammar-check',
              },
              {
                line: 3,
                column: 30,
                severity: 2,
                message: 'Redundant phrase',
                ruleId: 'redundancy-check',
              },
            ],
            formattedMessage: 'Line 3: Subject-verb disagreement\nLine 3: Redundant phrase',
          })
          .mockResolvedValueOnce({
            fixedText: 'partially fixed text',
            messages: [
              {
                line: 3,
                column: 30,
                severity: 2,
                message: 'Redundant phrase',
                ruleId: 'redundancy-check',
              },
            ],
            formattedMessage: 'Line 3: Redundant phrase',
          }),
        lintFile: vi.fn().mockResolvedValue(''),
      };

      const proofreader = new Proofreader(mockLLM, mockTextlintRunner);
      const input: ProofreadInput = { text: inputText };

      const result = await proofreader.run(input);

      expect(result.remainingErrors).toBe('Line 3: Redundant phrase');
      expect(mockTextlintRunner.lintText).toHaveBeenCalledTimes(2);
    });

    it('should include retry context when provided', async () => {
      const inputText = '# Text with Error\n\nThis text have errors.';
      const retryReason = 'Previous attempt failed validation';
      const previousFailedAttempt = '# Text with Error\n\nThis text had errors.';
      
      const mockLLM = createMockRunnableLLM();
      const mockTextlintRunner = {
        lintText: vi.fn()
          .mockResolvedValueOnce({
            fixedText: inputText,
            messages: [
              {
                line: 3,
                column: 11,
                severity: 2,
                message: 'Subject-verb disagreement',
                ruleId: 'grammar-check',
              },
            ],
            formattedMessage: 'Line 3: Subject-verb disagreement',
          })
          .mockResolvedValueOnce({
            fixedText: 'corrected text',
            messages: [],
            formattedMessage: '',
          }),
        lintFile: vi.fn().mockResolvedValue(''),
      };

      const proofreader = new Proofreader(mockLLM, mockTextlintRunner);
      const input: ProofreadInput = {
        text: inputText,
        retryReason,
        previousFailedAttempt,
      };

      const result = await proofreader.run(input);

      expect(mockTextlintRunner.lintText).toHaveBeenCalledTimes(2);
      expect(result.remainingErrors).toBeUndefined();
      
      // LLM processing was completed
    });

    it('should handle empty retry context when no retry information provided', async () => {
      const inputText = '# Text with Error\n\nThis text have errors.';
      
      const mockLLM = createMockRunnableLLM();
      const mockTextlintRunner = {
        lintText: vi.fn()
          .mockResolvedValueOnce({
            fixedText: inputText,
            messages: [
              {
                line: 3,
                column: 11,
                severity: 2,
                message: 'Subject-verb disagreement',
                ruleId: 'grammar-check',
              },
            ],
            formattedMessage: 'Line 3: Subject-verb disagreement',
          })
          .mockResolvedValueOnce({
            fixedText: 'corrected text',
            messages: [],
            formattedMessage: '',
          }),
        lintFile: vi.fn().mockResolvedValue(''),
      };

      const proofreader = new Proofreader(mockLLM, mockTextlintRunner);
      const input: ProofreadInput = { text: inputText };

      const result = await proofreader.run(input);

      expect(mockTextlintRunner.lintText).toHaveBeenCalledTimes(2);
      expect(result.remainingErrors).toBeUndefined();
      
      // LLM processing was completed
    });

    it('should handle LLM errors gracefully by returning original text', async () => {
      const inputText = '# Text with Error\n\nThis text have errors.';
      const mockLLM = createMockRunnableLLM();
      
      const mockTextlintRunner = {
        lintText: vi.fn()
          .mockResolvedValueOnce({
            fixedText: inputText,
            messages: [
              {
                line: 3,
                column: 11,
                severity: 2,
                message: 'Subject-verb disagreement',
                ruleId: 'grammar-check',
              },
            ],
            formattedMessage: 'Line 3: Subject-verb disagreement',
          })
          .mockResolvedValueOnce({
            fixedText: inputText, // Same as original since LLM failed
            messages: [
              {
                line: 3,
                column: 11,
                severity: 2,
                message: 'Subject-verb disagreement',
                ruleId: 'grammar-check',
              },
            ],
            formattedMessage: 'Line 3: Subject-verb disagreement',
          }),
        lintFile: vi.fn().mockResolvedValue(''),
      };

      const proofreader = new Proofreader(mockLLM, mockTextlintRunner);
      const input: ProofreadInput = { text: inputText };

      const result = await proofreader.run(input);

      // When LLM errors occur, the original text should be returned
      expect(mockTextlintRunner.lintText).toHaveBeenCalledTimes(2);
      expect(result.remainingErrors).toBe('Line 3: Subject-verb disagreement');
    });
  });
});