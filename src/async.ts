import type { AsyncFn, MemoFunc, MemoOptions } from './types';

import { State, clearNode, makeNode, walkAndCreate, walkOrBreak } from './trie';

export function memoAsync<F extends AsyncFn>(fn: F, options: MemoOptions<F> = {}): MemoFunc<F> {
  const root = makeNode<F>();

  const memoFunc = async function (...args: Parameters<F>) {
    // Serialize args
    const path = options.serialize ? options.serialize(...args) : args;
    const cur = walkAndCreate<F, any[]>(root, path);

    if (cur.state === State.Ok) {
      return cur.value;
    } else if (cur.state === State.Error) {
      throw cur.error;
    } else if (cur.state === State.Waiting) {
      return new Promise((res, rej) => {
        if (!cur.callbacks) {
          cur.callbacks = new Set();
        }
        cur.callbacks!.add({ res, rej });
      });
    } else {
      try {
        cur.state = State.Waiting;
        const value = await fn(...args);
        cur.state = State.Ok;
        cur.value = value;

        // Resolve other waiting callbacks
        for (const callback of cur.callbacks ?? []) {
          callback.res(value);
        }

        return value;
      } catch (error) {
        cur.state = State.Error;
        cur.error = error;

        // Reject other waiting callbacks
        for (const callback of cur.callbacks ?? []) {
          callback.rej(error);
        }

        throw error;
      }
    }
  } as MemoFunc<F>;

  memoFunc.raw = (...args) => {
    return fn(...args) as ReturnType<F>;
  };

  memoFunc.clear = (...args) => {
    if (args.length === 0) {
      clearNode(root);
    } else {
      const cur = walkOrBreak<F>(root, args as Parameters<F>);
      clearNode(cur);
    }
  };

  return memoFunc;
}
