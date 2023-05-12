type Fn = (...params: unknown[]) => unknown;

const enum CallState {
  // 参数未结束
  Default,
  // 返回值
  Return,
  // 调用出错
  Error
}

interface MemoNode<T extends (...args: any) => any> {
  state: CallState;
  value: ReturnType<T> | null;
  error: unknown;
  primitive: Map<any, MemoNode<T>>;
  reference: WeakMap<any, MemoNode<T>>;
}

function makeMemoNode<T extends (...args: any) => any>(): MemoNode<T> {
  return {
    state: CallState.Default,
    value: null,
    error: null,
    primitive: new Map(),
    reference: new WeakMap()
  };
}

function isPrimitiveType(value: unknown) {
  return (typeof value !== 'object' && typeof value !== 'function') || value === null;
}

export function memo(fn: Fn): Fn {
  const memo = makeMemoNode();
  return function (...args: unknown[]) {
    let cur = memo;
    for (const arg of args) {
      if (isPrimitiveType(arg)) {
        if (cur.primitive.has(arg)) {
          cur = cur.primitive.get(arg)!;
        } else {
          const newNode = makeMemoNode();
          cur.primitive.set(arg, newNode);
          cur = newNode;
        }
      } else {
        if (cur.reference.has(arg)) {
          cur = cur.reference.get(arg)!;
        } else {
          const newNode = makeMemoNode();
          cur.reference.set(arg, newNode);
          cur = newNode;
        }
      }
    }
    if (cur.state === CallState.Return) {
      return cur.value;
    } else if (cur.state === CallState.Error) {
      throw cur.error;
    } else {
      try {
        const value = fn(...args);
        cur.state = CallState.Return;
        cur.value = value;
        return value;
      } catch (error) {
        cur.state = CallState.Error;
        cur.error = error;
        throw error;
      }
    }
  };
}
