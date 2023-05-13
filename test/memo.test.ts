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

  it('should clear cache', () => {
    let count = 0;
    const add = memo((a: number, b: number) => {
      count++;
      return a + b;
    });
    expect(add(1, 1)).toBe(2);
    expect(add(1, 1)).toBe(2);
    expect(add(1, 1)).toBe(2);
    expect(count).toBe(1);

    add.clear();
    expect(add(1, 1)).toBe(2);
    expect(add(1, 1)).toBe(2);
    expect(add(1, 1)).toBe(2);
    expect(count).toBe(2);
  });
});
