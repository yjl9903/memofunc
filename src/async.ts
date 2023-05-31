import type { AsyncFn, MemoFunc, MemoAsyncOptions } from './types';

import { State, clearNode, makeNode, walkAndCreate, walkOrBreak } from './trie';

export function memoAsync<F extends AsyncFn>(
  fn: F,
  options: MemoAsyncOptions<F> = {}
): MemoFunc<F> {
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

        const external = options.external ? await options.external.get(args) : undefined;
        const value = external !== undefined && external !== null ? external : await fn(...args);

        cur.state = State.Ok;
        cur.value = value;

        if (options.external) {
          await options.external.set(args, value);
        }

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

  memoFunc.get = (...args) => {
    return memoFunc(...args);
  };

  memoFunc.raw = (...args) => {
    return fn(...args) as ReturnType<F>;
  };

  memoFunc.clear = async (...args) => {
    if (args.length === 0) {
      clearNode(root);
      if (options.external) {
        await options.external.clear();
      }
    } else {
      const cur = walkOrBreak<F>(root, args as Parameters<F>);
      clearNode(cur);
      if (options.external) {
        await options.external.remove(args as Parameters<F>);
      }
    }
  };

  return memoFunc;
}
