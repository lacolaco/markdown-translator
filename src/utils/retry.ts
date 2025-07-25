/**
 * Information about the last attempt result
 */
export interface LastAttemptResult<T> {
  /** Reason for the failure (if any) */
  failureReason?: string;
  /** Result from the previous attempt (if any) */
  previousResult?: T;
}

/**
 * Options for conditional retry loop
 */
export interface RetryOptions<T> {
  /** Maximum number of attempts */
  maxAttempts: number;
  /** Function to execute on each attempt. Receives information about the last attempt */
  attempt: (lastAttemptResult?: LastAttemptResult<T>) => Promise<T>;
  /** Function to check if the result is successful. Returns true for success, string for failure reason */
  validate: (result: T) => true | string;
  /** Function to handle errors (optional) */
  onError?: (error: unknown, attemptNumber: number) => void;
  /** Function called when max attempts reached (optional) */
  onMaxAttemptsReached?: (lastResult: T) => T;
}

/**
 * Executes a conditional retry loop that continues until success condition is met or max attempts reached
 * @param options - Retry configuration options
 * @returns Promise resolving to the successful result or fallback value
 */
export async function retryUntilSuccess<T>(
  options: RetryOptions<T>
): Promise<T> {
  const { maxAttempts, attempt, validate, onError, onMaxAttemptsReached } =
    options;

  let lastResult: T | null = null;
  let lastFailureReason: string | undefined = undefined;

  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
    try {
      const lastAttemptResult: LastAttemptResult<T> | undefined =
        attemptNumber === 1
          ? undefined
          : {
              failureReason: lastFailureReason,
              previousResult: lastResult || undefined,
            };

      const result = await attempt(lastAttemptResult);
      lastResult = result;

      const validationResult = validate(result);
      if (validationResult === true) {
        return result;
      }

      // Validation failed, store the reason for next attempt
      lastFailureReason = validationResult;
    } catch (error) {
      onError?.(error, attemptNumber);
      lastFailureReason = `実行エラー: ${error}`;
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
