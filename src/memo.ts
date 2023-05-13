import type { Fn, MemoFn } from './types';

import { State, makeNode, walk } from './trie';

export function memo<F extends Fn>(fn: F): MemoFn<F> {
  const root = makeNode<F>();
  return function (...args: Parameters<F>) {
    const cur = walk<F>(root, args);
    if (cur.state === State.Ok) {
      return cur.value;
    } else if (cur.state === State.Error) {
      throw cur.error;
    } else {
      try {
        const value = fn(...args);
        cur.state = State.Ok;
        cur.value = value;
        return value;
      } catch (error) {
        cur.state = State.Error;
        cur.error = error;
        throw error;
      }
    }
  };
}
