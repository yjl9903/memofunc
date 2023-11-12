export interface MemoOptions<F extends Fn, S extends unknown[] = unknown[]> {
  /**
   * Serialize the function call arguments
   * This is used to identify cache key
   */
  serialize?: (this: MemoFunc<F>, ...args: Parameters<F>) => S;
}

export interface MemoAsyncOptions<F extends Fn> extends MemoOptions<F> {
  external?: {
    get: (
      this: MemoFunc<F>,
      args: Parameters<F>
    ) => Promise<Awaited<ReturnType<F>> | undefined | null>;

    set: (this: MemoFunc<F>, args: Parameters<F>, value: Awaited<ReturnType<F>>) => Promise<void>;

    remove: (this: MemoFunc<F>, args: Parameters<F>) => Promise<void>;

    clear: (this: MemoFunc<F>) => Promise<void>;

    error?: (err: unknown) => void | Promise<void>;
  };
}

export type Fn = (...params: any[]) => any;

export type AsyncFn = (...params: any[]) => Promise<any>;

export interface MemoFunc<F extends Fn> {
  // Call the target function, if cache is valid, return cache
  (...args: Parameters<F>): ReturnType<F>;

  // Call the target function, if cache is valid, return cache
  get(...args: Parameters<F>): ReturnType<F>;

  // Call the raw function and skip cache
  raw(...args: Parameters<F>): ReturnType<F>;

  // Remove cache
  remove(...args: Parameters<F>): void | Promise<void>;

  // Clear all the cache
  clear(): void | Promise<void>;

  // External cache
  external?: MemoAsyncOptions<F>['external'];
}
