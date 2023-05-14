import type { Fn } from './types';
import { isPrimitiveType } from './utils';

export const enum State {
  Empty,
  Ok,
  Waiting,
  Error
}

export interface Node<T extends Fn> {
  state: State;
  value: ReturnType<T> | undefined;
  error: unknown;
  primitive: Map<any, Node<T>>;
  reference: WeakMap<any, Node<T>>;
  callbacks?: Set<{ res: (value: ReturnType<T>) => void; rej: (error: unknown) => void }>;
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

export function clearNode<T extends Fn>(node: Node<T> | undefined) {
  if (node) {
    node.state = State.Empty;
    node.value = undefined;
    node.error = undefined;
    node.primitive = new Map();
    node.reference = new WeakMap();
  }
}

function walkBase<T extends Fn, P extends any[] = Parameters<T>>(
  node: Node<T>,
  args: P,
  hooks: { makeNode: () => Node<T> | undefined }
): Node<T> | undefined {
  let cur = node;
  for (const arg of args) {
    if (isPrimitiveType(arg)) {
      if (cur.primitive.has(arg)) {
        cur = cur.primitive.get(arg)!;
      } else {
        const newNode = hooks.makeNode();
        if (newNode) {
          cur.primitive.set(arg, newNode);
          cur = newNode;
        } else {
          return undefined;
        }
      }
    } else {
      if (cur.reference.has(arg)) {
        cur = cur.reference.get(arg)!;
      } else {
        const newNode = hooks.makeNode();
        if (newNode) {
          cur.reference.set(arg, newNode);
          cur = newNode;
        } else {
          return undefined;
        }
      }
    }
  }
  return cur;
}

export function walkAndCreate<T extends Fn, P extends any[] = Parameters<T>>(
  node: Node<T>,
  args: P
) {
  return walkBase(node, args, { makeNode })!;
}

export function walkOrBreak<T extends Fn, P extends any[] = Parameters<T>>(node: Node<T>, args: P) {
  return walkBase(node, args, { makeNode: () => undefined });
}
