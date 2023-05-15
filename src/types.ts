export interface MemoOptions<F extends Fn> {
  /**
   * Serialize the function call arguments
   * This is used to identify cache key
   */
  serialize?: (...args: Parameters<F>) => any[];
}

export type Fn = (...params: any[]) => any;

export type AsyncFn = (...params: any[]) => Promise<any>;

export interface MemoFunc<F extends Fn> {
  // Call the target function, if cache is valid, return cache
  (...args: Parameters<F>): ReturnType<F>;

  // Same with this function
  get(...args: Parameters<F>): ReturnType<F>;

  // Call the raw function and skip cache
  raw(...args: Parameters<F>): ReturnType<F>;

  // Clear cache
  clear(...args: Parameters<F> | []): void;
}
