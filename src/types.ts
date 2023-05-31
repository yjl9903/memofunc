export interface MemoOptions<F extends Fn, S extends unknown[] = unknown[]> {
  /**
   * Serialize the function call arguments
   * This is used to identify cache key
   */
  serialize?: (...args: Parameters<F>) => S;
}

export interface MemoAsyncOptions<F extends Fn> extends MemoOptions<F> {
  external?: {
    get: (args: Parameters<F>) => Promise<Awaited<ReturnType<F>> | undefined | null>;

    set: (args: Parameters<F>, value: Awaited<ReturnType<F>>) => Promise<void>;

    remove: (args: Parameters<F>) => Promise<void>;

    clear: () => Promise<void>;
  };
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
  clear(...args: Parameters<F> | []): void | Promise<void>;
}
