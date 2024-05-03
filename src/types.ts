export interface MemoOptions<F extends Fn, S extends unknown[] = unknown[]> {
  /**
   * Serialize the function call arguments
   * This is used to identify cache key
   */
  serialize?: (this: MemoFunc<F>, ...args: Parameters<F>) => S;

  /**
   * Default expiration time duration (in milliseconds)
   */
  expirationTtl?: number;
}

export interface MemoAsyncOptions<F extends Fn, S extends unknown[] = unknown[]> {
  /**
   * Serialize the function call arguments
   * This is used to identify cache key
   */
  serialize?: (this: MemoAsyncFunc<F>, ...args: Parameters<F>) => S;

  /**
   * Default expiration time duration (in milliseconds)
   */
  expirationTtl?: number;

  external?: {
    get: (
      this: MemoAsyncFunc<F>,
      args: Parameters<F>
    ) => Promise<Awaited<ReturnType<F>> | undefined | null>;

    set: (
      this: MemoAsyncFunc<F>,
      args: Parameters<F>,
      value: Awaited<ReturnType<F>>
    ) => Promise<void>;

    remove: (this: MemoAsyncFunc<F>, args: Parameters<F>) => Promise<void>;

    clear: (this: MemoAsyncFunc<F>) => Promise<void>;

    error?: (err: unknown) => void | Promise<void>;
  };
}

export interface MemoExternalOptions<F extends Fn, S extends unknown[] = unknown[]> {
  /**
   * Serialize the function call arguments
   * This is used to identify cache key
   */
  serialize?: (this: MemoExternalFunc<F>, ...args: Parameters<F>) => S;

  external: {
    get: (
      this: MemoExternalFunc<F>,
      args: Parameters<F>
    ) => Promise<Awaited<ReturnType<F>> | undefined | null>;

    set: (
      this: MemoExternalFunc<F>,
      args: Parameters<F>,
      value: Awaited<ReturnType<F>>
    ) => Promise<void>;

    remove: (this: MemoExternalFunc<F>, args: Parameters<F>) => Promise<void>;

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
  remove(...args: Parameters<F>): void;

  // Clear all the cache
  clear(): void;

  /**
   * Default expiration time duration (in seconds)
   */
  expirationTtl?: number;
}

export interface MemoAsyncFunc<F extends Fn> {
  // Call the target function, if cache is valid, return cache
  (...args: Parameters<F>): ReturnType<F>;

  // Call the target function, if cache is valid, return cache
  get(...args: Parameters<F>): ReturnType<F>;

  // Call the raw function and skip cache
  raw(...args: Parameters<F>): ReturnType<F>;

  // Remove cache
  remove(...args: Parameters<F>): Promise<void>;

  // Clear all the cache
  clear(): Promise<void>;

  /**
   * Default expiration time duration (in seconds)
   */
  expirationTtl?: number;

  // External cache
  external?: MemoAsyncOptions<F>['external'];
}

export interface MemoExternalFunc<F extends Fn> {
  // Call the target function, if cache is valid, return cache
  (...args: Parameters<F>): ReturnType<F>;

  // Call the target function, if cache is valid, return cache
  get(...args: Parameters<F>): ReturnType<F>;

  // Call the raw function and skip cache
  raw(...args: Parameters<F>): ReturnType<F>;

  // Remove cache
  remove(...args: Parameters<F>): Promise<void>;

  // Update cache
  update(...args: Parameters<F>): ReturnType<F>;

  // External cache
  external?: MemoExternalOptions<F>['external'];
}
