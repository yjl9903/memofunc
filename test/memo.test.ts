import { describe, it, expect, expectTypeOf } from 'vitest';

import { memo } from '../src';

describe('memo', () => {
  it('should work', () => {
    const add = memo((a: number, b: number) => a + b);
    expect(add(1, 1)).toBe(2);
    expect(add(1, 1)).toBe(2);
    expect(add(1, 1)).toBe(2);
    expect(add(1, 2)).toBe(3);
    expect(add(1, 2)).toBe(3);
    expect(add(1, 2)).toBe(3);
    expect(add(2, 2)).toBe(4);
    expect(add(2, 2)).toBe(4);
    expect(add(2, 2)).toBe(4);
  });

  it('should have type', () => {
    const addStr = memo((a: number, b: string) => a + b);
    expectTypeOf(addStr).toMatchTypeOf<(a: number, b: string) => string>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: string, b: string) => string>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: number, b: number) => string>();
    expectTypeOf(addStr).not.toMatchTypeOf<(a: number | string, b: number | string) => string>();
  });
});
