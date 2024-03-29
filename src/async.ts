import type { AsyncFn, MemoAsyncFunc, MemoAsyncOptions } from './types';

import { State, clearNode, clearNodeCache, makeNode, walkAndCreate, walkOrBreak } from './trie';

export function memoAsync<F extends AsyncFn>(
  fn: F,
  options: MemoAsyncOptions<F> = {}
): MemoAsyncFunc<F> {
  const root = makeNode<F>();

  const memoFunc = async function (...args: Parameters<F>) {
    // Serialize args
    const path = options.serialize ? options.serialize.bind(memoFunc)(...args) : args;
    const cur = walkAndCreate<F, any[]>(root, path);

    if ((cur.state === State.Ok || cur.state === State.Error) && cur.expiration !== undefined) {
      // Cache expire
      if (new Date().getTime() > cur.expiration) {
        clearNodeCache(cur);
      }
    }

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

        const externalOnError = options.external?.error ?? (() => undefined);
        const external = options.external
          ? await options.external.get.bind(memoFunc)(args).catch(externalOnError)
          : undefined;
        const hasExternalCache = external !== undefined && external !== null;
        const value = hasExternalCache ? external : await fn(...args);

        cur.state = State.Ok;
        cur.value = value;

        if (memoFunc.expirationTtl !== undefined && memoFunc.expirationTtl !== null) {
          const now = new Date();
          cur.expiration = now.getTime() + memoFunc.expirationTtl;
        }

        if (!hasExternalCache && options.external) {
          await options.external.set.bind(memoFunc)(args, value).catch(externalOnError);
        }

        // Resolve other waiting callbacks
        for (const callback of cur.callbacks ?? []) {
          callback.res(value);
        }
        // Release callbacks
        cur.callbacks = undefined;

        return value;
      } catch (error) {
        cur.state = State.Error;
        cur.error = error;

        // Reject other waiting callbacks
        for (const callback of cur.callbacks ?? []) {
          callback.rej(error);
        }
        // Release callbacks
        cur.callbacks = undefined;

        throw error;
      }
    }
  } as MemoAsyncFunc<F>;

  memoFunc.expirationTtl = options.expirationTtl;

  memoFunc.get = (...args) => {
    return memoFunc(...args);
  };

  memoFunc.raw = (...args) => {
    return fn(...args) as ReturnType<F>;
  };

  memoFunc.remove = async (...args) => {
    const path = options.serialize ? options.serialize.bind(memoFunc)(...args) : args;
    const cur = walkOrBreak<F, any[]>(root, path);

    clearNode(cur);
    if (options.external) {
      await options.external.remove
        .bind(memoFunc)(args as Parameters<F>)
        .catch(options.external?.error ?? (() => undefined));
    }
  };

  memoFunc.clear = async () => {
    clearNode(root);
    if (options.external) {
      await options.external.clear
        .bind(memoFunc)()
        .catch(options.external?.error ?? (() => undefined));
    }
  };

  memoFunc.external = options.external;

  return memoFunc;
}
