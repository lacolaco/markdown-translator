/**
 * Options for conditional retry loop
 */
export interface RetryOptions<T> {
  /** Maximum number of attempts */
  maxAttempts: number;
  /** Function to execute on each attempt */
  attempt: (attemptNumber: number) => Promise<T>;
  /** Function to check if the result is successful and should stop retrying */
  isSuccess: (result: T) => boolean;
  /** Function to handle errors (optional) */
  onError?: (error: unknown, attemptNumber: number) => void;
  /** Function called when max attempts reached (optional) */
  onMaxAttemptsReached?: (lastResult: T | null) => T;
}

/**
 * Executes a conditional retry loop that continues until success condition is met or max attempts reached
 * @param options - Retry configuration options
 * @returns Promise resolving to the successful result or fallback value
 */
export async function retryUntilSuccess<T>(
  options: RetryOptions<T>
): Promise<T> {
  const {
    maxAttempts,
    attempt,
    isSuccess,
    onError,
    onMaxAttemptsReached,
  } = options;

  let lastResult: T | null = null;

  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
    try {
      const result = await attempt(attemptNumber);
      lastResult = result;

      if (isSuccess(result)) {
        return result;
      }
    } catch (error) {
      onError?.(error, attemptNumber);
    }
  }

  // Max attempts reached
  if (onMaxAttemptsReached && lastResult !== null) {
    return onMaxAttemptsReached(lastResult);
  }

  // If no onMaxAttemptsReached handler and we have a last result, return it
  if (lastResult !== null) {
    return lastResult;
  }

  // This should not happen in normal cases, but provide a fallback
  throw new Error(`Failed after ${maxAttempts} attempts with no valid result`);
}