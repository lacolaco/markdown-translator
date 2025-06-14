import { describe, it, expect, vi } from 'vitest';
import { retryUntilSuccess } from './retry-utils';

describe('Retry Utils', () => {
  describe('retryUntilSuccess', () => {
    it('should return result immediately when success condition is met on first attempt', async () => {
      const attemptFn = vi.fn().mockResolvedValue('success');
      const isSuccessFn = vi.fn().mockReturnValue(true);

      const result = await retryUntilSuccess({
        maxAttempts: 3,
        attempt: attemptFn,
        isSuccess: isSuccessFn,
      });

      expect(result).toBe('success');
      expect(attemptFn).toHaveBeenCalledTimes(1);
      expect(attemptFn).toHaveBeenCalledWith(1);
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
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const result = await retryUntilSuccess({
        maxAttempts: 3,
        attempt: attemptFn,
        isSuccess: isSuccessFn,
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
        isSuccess: isSuccessFn,
        onError: onErrorFn,
      });

      expect(result).toBe('success');
      expect(attemptFn).toHaveBeenCalledTimes(3);
      expect(onErrorFn).toHaveBeenCalledTimes(2);
      expect(onErrorFn).toHaveBeenNthCalledWith(1, new Error('First error'), 1);
      expect(onErrorFn).toHaveBeenNthCalledWith(2, new Error('Second error'), 2);
    });

    it('should call onMaxAttemptsReached when max attempts reached without success', async () => {
      const attemptFn = vi
        .fn()
        .mockResolvedValueOnce('fail1')
        .mockResolvedValueOnce('fail2');
      
      const isSuccessFn = vi.fn().mockReturnValue(false);
      const onMaxAttemptsReachedFn = vi.fn().mockReturnValue('fallback');

      const result = await retryUntilSuccess({
        maxAttempts: 2,
        attempt: attemptFn,
        isSuccess: isSuccessFn,
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
      
      const isSuccessFn = vi.fn().mockReturnValue(false);

      const result = await retryUntilSuccess({
        maxAttempts: 2,
        attempt: attemptFn,
        isSuccess: isSuccessFn,
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
          isSuccess: isSuccessFn,
          onError: onErrorFn,
        })
      ).rejects.toThrow('Failed after 2 attempts with no valid result');

      expect(attemptFn).toHaveBeenCalledTimes(2);
      expect(onErrorFn).toHaveBeenCalledTimes(2);
      expect(isSuccessFn).not.toHaveBeenCalled();
    });

    it('should pass correct attempt numbers to attempt function', async () => {
      const attemptFn = vi
        .fn()
        .mockResolvedValueOnce('attempt1')
        .mockResolvedValueOnce('attempt2')
        .mockResolvedValueOnce('success');
      
      const isSuccessFn = vi
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      await retryUntilSuccess({
        maxAttempts: 3,
        attempt: attemptFn,
        isSuccess: isSuccessFn,
      });

      expect(attemptFn).toHaveBeenNthCalledWith(1, 1);
      expect(attemptFn).toHaveBeenNthCalledWith(2, 2);
      expect(attemptFn).toHaveBeenNthCalledWith(3, 3);
    });
  });
});