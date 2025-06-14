/**
 * Generic Agent interface for processing tasks
 * @template In - Input type
 * @template Out - Output type
 */
export interface Agent<In, Out> {
  /**
   * Executes the agent's main processing task
   * @param input - The input data to process
   * @returns Promise resolving to the processed output
   */
  run(input: In): Promise<Out>;
}