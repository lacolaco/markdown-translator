import { describe, it, expect, vi } from 'vitest';
import type { Agent } from './agent';

// Mock implementation for testing
class MockAgent implements Agent<string, string> {
  private processFunction: (input: string) => Promise<string>;

  constructor(processFunction: (input: string) => Promise<string>) {
    this.processFunction = processFunction;
  }

  async run(input: string): Promise<string> {
    return this.processFunction(input);
  }
}

describe('Agent Interface', () => {
  it('should allow implementing custom agents', async () => {
    const mockProcessor = vi.fn().mockResolvedValue('processed output');
    const agent = new MockAgent(mockProcessor);

    const result = await agent.run('test input');

    expect(result).toBe('processed output');
    expect(mockProcessor).toHaveBeenCalledWith('test input');
  });

  it('should handle async processing', async () => {
    const agent = new MockAgent(async input => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return input.split('').reverse().join('');
    });

    const result = await agent.run('hello');

    expect(result).toBe('olleh');
  });

  it('should allow different input/output types through generics', async () => {
    interface NumberInput {
      value: number;
      multiplier: number;
    }

    class NumberAgent implements Agent<NumberInput, number> {
      async run(input: NumberInput): Promise<number> {
        return input.value * input.multiplier;
      }
    }

    const agent = new NumberAgent();
    const result = await agent.run({ value: 5, multiplier: 3 });

    expect(result).toBe(15);
  });
});
