import { describe, it, expectTypeOf } from 'vitest';

import { memo } from '../src';

describe('memo', () => {
  it('should have type', () => {
    const addStr = memo((a: number, b: string) => a + b);
    expectTypeOf(addStr).toMatchTypeOf<(a: number, b: string) => string>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: string, b: string) => string>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: number, b: number) => string>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: number | string, b: number | string) => string>();
  });
});
