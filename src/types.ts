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
  (...args: Parameters<F>): ReturnType<F>;

  raw(...args: Parameters<F>): ReturnType<F>;

  clear(...args: Parameters<F> | []): void;
}
