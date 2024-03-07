import type { AsyncFn, MemoExternalFunc, MemoExternalOptions } from './types';

import { State, clearNode, makeNode, walkAndCreate, walkOrBreak } from './trie';

export function memoExternal<F extends AsyncFn>(
  fn: F,
  options: MemoExternalOptions<F>
): MemoExternalFunc<F> {
  const root = makeNode<F>();

  const memoFunc = async function (...args: Parameters<F>) {
    // Serialize args
    const path = options.serialize ? options.serialize.bind(memoFunc)(...args) : args;
    const cur = walkAndCreate<F, any[]>(root, path);

    // if (cur.state === State.Ok) {
    //   return cur.value;
    // } else if (cur.state === State.Error) {
    //   throw cur.error;
    // } else
    if (cur.state === State.Waiting) {
      return new Promise((res, rej) => {
        if (!cur.callbacks) {
          cur.callbacks = new Set();
        }
        cur.callbacks!.add({ res, rej });
      });
    } else if (cur.state === State.Updating) {
      let updatedValue: ReturnType<F>;
      while (cur.state === State.Updating) {
        updatedValue = await new Promise((res, rej) => {
          if (!cur.updatingCallbacks) {
            cur.updatingCallbacks = new Set();
          }
          cur.updatingCallbacks!.add({ res, rej });
        });
      }
      return updatedValue!;
    } else {
      try {
        cur.state = State.Waiting;

        const externalOnError = options.external.error ?? (() => undefined);
        const external = await options.external.get.bind(memoFunc)(args).catch(externalOnError);

        const hasExternalCache = external !== undefined && external !== null;
        const value = hasExternalCache ? external : await fn(...args);

        cur.state = State.Empty;
        cur.value = value;

        if (!hasExternalCache) {
          await options.external.set.bind(memoFunc)(args, value).catch(externalOnError);
        }

        try {
          // Resolve other waiting callbacks
          for (const callback of cur.callbacks ?? []) {
            callback.res(value);
          }
          // Release callbacks
          cur.callbacks = undefined;
        } catch {
          // Should not have errors here
        }

        return value;
      } catch (error) {
        cur.state = State.Empty;
        cur.error = error;

        try {
          // Reject other waiting callbacks
          for (const callback of cur.callbacks ?? []) {
            callback.rej(error);
          }
          // Release callbacks
          cur.callbacks = undefined;
        } catch {
          // Ignore errors
        }

        throw error;
      }
    }
  } as MemoExternalFunc<F>;

  memoFunc.get = (...args) => {
    return memoFunc(...args);
  };

  memoFunc.raw = (...args) => {
    return fn(...args) as ReturnType<F>;
  };

  memoFunc.remove = async (...args) => {
    const path = options.serialize ? options.serialize.bind(memoFunc)(...args) : args;
    const cur = walkOrBreak<F, any[]>(root, path);

    if (cur) {
      await options.external.remove
        .bind(memoFunc)(args as Parameters<F>)
        .catch(options.external?.error ?? (() => undefined));
    }
  };

  memoFunc.update = async (...args) => {
    const path = options.serialize ? options.serialize.bind(memoFunc)(...args) : args;
    const cur = walkAndCreate<F, any[]>(root, path);

    while (cur.state === State.Waiting || cur.state === State.Updating) {
      if (cur.state === State.Waiting) {
        await new Promise((res) => {
          if (!cur.callbacks) {
            cur.callbacks = new Set();
          }
          // Ignore error
          cur.callbacks!.add({ res, rej: () => {} });
        });
      } else if (cur.state === State.Updating) {
        await new Promise((res) => {
          if (!cur.updatingCallbacks) {
            cur.updatingCallbacks = new Set();
          }
          // Ignore error
          cur.updatingCallbacks!.add({ res, rej: () => {} });
        });
      } else {
        break;
      }
    }

    try {
      cur.state = State.Updating;

      const externalOnError = options.external.error ?? (() => undefined);
      const value = await fn(...args);
      await options.external.set.bind(memoFunc)(args, value).catch(externalOnError);

      cur.state = State.Empty;

      try {
        // Resolve other waiting callbacks
        for (const callback of cur.updatingCallbacks ?? []) {
          callback.res(value);
        }
        cur.updatingCallbacks = undefined;
      } catch {
        // Should not have errors here
      }

      return value;
    } catch (error) {
      cur.state = State.Empty;

      try {
        // Resolve other waiting callbacks
        for (const callback of cur.updatingCallbacks ?? []) {
          callback.rej(error);
        }
        cur.updatingCallbacks = undefined;
      } catch {
        // Should not have errors here
      }

      throw error;
    }
  };

  memoFunc.external = options.external;

  return memoFunc;
}
