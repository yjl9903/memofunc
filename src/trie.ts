import type { Fn } from './types';
import { isPrimitiveType } from './utils';

export const enum State {
  Empty,
  Ok,
  Error
}

export interface Node<T extends Fn> {
  state: State;
  value: ReturnType<T> | undefined;
  error: unknown;
  primitive: Map<any, Node<T>>;
  reference: WeakMap<any, Node<T>>;
}

export function makeNode<T extends Fn>(): Node<T> {
  return {
    state: State.Empty,
    value: undefined,
    error: undefined,
    primitive: new Map(),
    reference: new WeakMap()
  };
}

export function walk<T extends Fn>(node: Node<T>, args: Parameters<T>): Node<T> {
  let cur = node;
  for (const arg of args) {
    if (isPrimitiveType(arg)) {
      if (cur.primitive.has(arg)) {
        cur = cur.primitive.get(arg)!;
      } else {
        const newNode = makeNode<T>();
        cur.primitive.set(arg, newNode);
        cur = newNode;
      }
    } else {
      if (cur.reference.has(arg)) {
        cur = cur.reference.get(arg)!;
      } else {
        const newNode = makeNode<T>();
        cur.reference.set(arg, newNode);
        cur = newNode;
      }
    }
  }
  return cur;
}
