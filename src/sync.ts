import type { Fn, MemoFunc, MemoOptions } from './types';

import { State, clearNode, clearNodeCache, makeNode, walkAndCreate, walkOrBreak } from './trie';

export function memo<F extends Fn>(fn: F, options: MemoOptions<F> = {}): MemoFunc<F> {
  const root = makeNode<F>();

  const memoFunc = function (...args: Parameters<F>) {
    // Serialize args
    const path = options.serialize ? options.serialize.bind(memoFunc)(...args) : args;
    const cur = walkAndCreate<F, any[]>(root, path);

    if (cur.expiration !== undefined) {
      // Cache expire
      if (new Date().getTime() > cur.expiration) {
        clearNodeCache(cur);
      }
    }

    if (cur.state === State.Ok) {
      return cur.value;
    } else if (cur.state === State.Error) {
      throw cur.error;
    } else {
      try {
        const value = fn(...args);
        cur.state = State.Ok;
        cur.value = value;

        if (memoFunc.expirationTtl !== undefined && memoFunc.expirationTtl !== null) {
          const now = new Date();
          cur.expiration = now.getTime() + memoFunc.expirationTtl;
        }

        return value;
      } catch (error) {
        cur.state = State.Error;
        cur.error = error;
        throw error;
      }
    }
  } as MemoFunc<F>;

  memoFunc.expirationTtl = options.expirationTtl;

  memoFunc.get = (...args) => {
    return memoFunc(...args);
  };

  memoFunc.raw = (...args) => {
    return fn(...args);
  };

  memoFunc.remove = (...args) => {
    const cur = walkOrBreak<F>(root, args as Parameters<F>);
    clearNode(cur);
  };

  memoFunc.clear = () => {
    clearNode(root);
  };

  return memoFunc;
}

export const memoSync = memo;
