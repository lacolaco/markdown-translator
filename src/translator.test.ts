import { StringOutputParser } from '@langchain/core/output_parsers';
import { FakeChatModel } from '@langchain/core/utils/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Translator } from './translator';

describe('Translator', () => {
  let translator: Translator;

  /**
   * Creates a mock Runnable Language Model for testing
   */
  const createMockRunnableLLM = () => {
    return new FakeChatModel({}).pipe(new StringOutputParser());
  };

  beforeEach(() => {
    translator = new Translator(createMockRunnableLLM(), '');
  });

  it('should accept text input and return string output', async () => {
    const inputText = 'Test text';
    
    const result = await translator.run({ text: inputText });
    
    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  it('should handle empty text input', async () => {
    const result = await translator.run({ text: '' });
    
    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  it('should handle multiline text input', async () => {
    const multilineText = 'Line 1\nLine 2\nLine 3';
    
    const result = await translator.run({ text: multilineText });
    
    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  it('should accept input with retry reason', async () => {
    const input = {
      text: 'Simple text',
      retryReason: 'Previous attempt failed',
    };

    const result = await translator.run(input);
    
    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  it('should accept input without retry reason', async () => {
    const input = { text: 'Simple text' };

    const result = await translator.run(input);
    
    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  it('should accept input with previous failed attempt', async () => {
    const input = {
      text: 'Test text',
      retryReason: 'Line count mismatch',
      previousFailedAttempt: 'Previous translation',
    };

    const result = await translator.run(input);

    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  it('should accept custom runnable in constructor', async () => {
    const inputText = 'Test text';

    const customRunnable = createMockRunnableLLM();
    const customTranslator = new Translator(customRunnable, '');

    const result = await customTranslator.run({ text: inputText });

    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  it('should accept additional instructions in constructor', async () => {
    const inputText = 'Test text';
    const additionalInstructions = 'Use formal language';

    const mockRunnable = createMockRunnableLLM();
    const customTranslator = new Translator(mockRunnable, additionalInstructions);
    
    const result = await customTranslator.run({ text: inputText });

    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  });

  it('should require runnable parameter in constructor', () => {
    const mockRunnable = createMockRunnableLLM();
    const translator = new Translator(mockRunnable, 'test instructions');

    expect(translator).toBeInstanceOf(Translator);
  });
});