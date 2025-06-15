import { describe, it, expect, vi } from 'vitest';
import { retryUntilSuccess } from './retry';

describe('Retry Utils', () => {
  describe('retryUntilSuccess', () => {
    it('should return result immediately when success condition is met on first attempt', async () => {
      const attemptFn = vi.fn().mockResolvedValue('success');
      const isSuccessFn = vi.fn().mockReturnValue(true);

      const result = await retryUntilSuccess({
        maxAttempts: 3,
        attempt: attemptFn,
        validate: isSuccessFn,
      });

      expect(result).toBe('success');
      expect(attemptFn).toHaveBeenCalledTimes(1);
      expect(attemptFn).toHaveBeenCalledWith(undefined);
      expect(isSuccessFn).toHaveBeenCalledWith('success');
    });

    it('should retry until success condition is met', async () => {
      const attemptFn = vi
        .fn()
        .mockResolvedValueOnce('fail1')
        .mockResolvedValueOnce('fail2')
        .mockResolvedValueOnce('success');

      const isSuccessFn = vi
        .fn()
        .mockReturnValueOnce('failed because fail1')
        .mockReturnValueOnce('failed because fail2')
        .mockReturnValueOnce(true);

      const result = await retryUntilSuccess({
        maxAttempts: 3,
        attempt: attemptFn,
        validate: isSuccessFn,
      });

      expect(result).toBe('success');
      expect(attemptFn).toHaveBeenCalledTimes(3);
      expect(isSuccessFn).toHaveBeenCalledTimes(3);
    });

    it('should handle errors and continue retrying', async () => {
      const attemptFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockRejectedValueOnce(new Error('Second error'))
        .mockResolvedValueOnce('success');

      const isSuccessFn = vi.fn().mockReturnValue(true);
      const onErrorFn = vi.fn();

      const result = await retryUntilSuccess({
        maxAttempts: 3,
        attempt: attemptFn,
        validate: isSuccessFn,
        onError: onErrorFn,
      });

      expect(result).toBe('success');
      expect(attemptFn).toHaveBeenCalledTimes(3);
      expect(onErrorFn).toHaveBeenCalledTimes(2);
      expect(onErrorFn).toHaveBeenNthCalledWith(1, new Error('First error'), 1);
      expect(onErrorFn).toHaveBeenNthCalledWith(
        2,
        new Error('Second error'),
        2
      );
    });

    it('should call onMaxAttemptsReached when max attempts reached without success', async () => {
      const attemptFn = vi
        .fn()
        .mockResolvedValueOnce('fail1')
        .mockResolvedValueOnce('fail2');

      const isSuccessFn = vi.fn().mockReturnValue('validation failed');
      const onMaxAttemptsReachedFn = vi.fn().mockReturnValue('fallback');

      const result = await retryUntilSuccess({
        maxAttempts: 2,
        attempt: attemptFn,
        validate: isSuccessFn,
        onMaxAttemptsReached: onMaxAttemptsReachedFn,
      });

      expect(result).toBe('fallback');
      expect(attemptFn).toHaveBeenCalledTimes(2);
      expect(onMaxAttemptsReachedFn).toHaveBeenCalledWith('fail2');
    });

    it('should return last result when max attempts reached and no onMaxAttemptsReached handler', async () => {
      const attemptFn = vi
        .fn()
        .mockResolvedValueOnce('fail1')
        .mockResolvedValueOnce('last-result');

      const isSuccessFn = vi.fn().mockReturnValue('validation failed');

      const result = await retryUntilSuccess({
        maxAttempts: 2,
        attempt: attemptFn,
        validate: isSuccessFn,
      });

      expect(result).toBe('last-result');
      expect(attemptFn).toHaveBeenCalledTimes(2);
    });

    it('should throw error when max attempts reached with only errors and no valid result', async () => {
      const attemptFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'));

      const isSuccessFn = vi.fn();
      const onErrorFn = vi.fn();

      await expect(
        retryUntilSuccess({
          maxAttempts: 2,
          attempt: attemptFn,
          validate: isSuccessFn,
          onError: onErrorFn,
        })
      ).rejects.toThrow('Failed after 2 attempts with no valid result');

      expect(attemptFn).toHaveBeenCalledTimes(2);
      expect(onErrorFn).toHaveBeenCalledTimes(2);
      expect(isSuccessFn).not.toHaveBeenCalled();
    });

    it('should pass retry reasons to attempt function', async () => {
      const attemptFn = vi
        .fn()
        .mockResolvedValueOnce('attempt1')
        .mockResolvedValueOnce('attempt2')
        .mockResolvedValueOnce('success');

      const isSuccessFn = vi
        .fn()
        .mockReturnValueOnce('first failure')
        .mockReturnValueOnce('second failure')
        .mockReturnValueOnce(true);

      await retryUntilSuccess({
        maxAttempts: 3,
        attempt: attemptFn,
        validate: isSuccessFn,
      });

      expect(attemptFn).toHaveBeenNthCalledWith(1, undefined);
      expect(attemptFn).toHaveBeenNthCalledWith(2, {
        failureReason: 'first failure',
        previousResult: 'attempt1',
      });
      expect(attemptFn).toHaveBeenNthCalledWith(3, {
        failureReason: 'second failure',
        previousResult: 'attempt2',
      });
    });
  });
});
