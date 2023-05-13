export type Fn = (...params: any[]) => any;

export interface MemoFn<F extends Fn> {
  (...args: Parameters<F>): ReturnType<F>;
}
