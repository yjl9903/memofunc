import { describe, it, expectTypeOf } from 'vitest';

import { memo, memoAsync } from '../src';

describe('memo sync', () => {
  it('should have type', () => {
    const addStr = memo((a: number, b: string) => a + b);
    expectTypeOf(addStr).toMatchTypeOf<(a: number, b: string) => string>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: string, b: string) => string>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: number, b: number) => string>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: number | string, b: number | string) => string>();
  });
});

describe('memo async', () => {
  it('should have type', () => {
    const addStr = memoAsync((a: number, b: string) => Promise.resolve(a + b));
    expectTypeOf(addStr).toMatchTypeOf<(a: number, b: string) => Promise<string>>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: string, b: string) => Promise<string>>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: number, b: number) => Promise<string>>();
    expectTypeOf(addStr).not.toMatchTypeOf<
      (a: number | string, b: number | string) => Promise<string>
    >();
  });
});
