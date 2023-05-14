import { describe, it, expect } from 'vitest';

import { memo, memoAsync } from '../src';

describe('memo sync', () => {
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

describe('memo async', () => {
  it('should work', async () => {
    let count = 0;
    const value = memoAsync(async () => {
      await sleep(100);
      return count++;
    });

    const task1 = value();
    const task2 = value();
    const task3 = value();
    expect(await task1).toBe(0);
    expect(await task2).toBe(0);
    expect(await task3).toBe(0);
    expect(count).toBe(1);
  });

  it('should sort', async () => {
    let visited = 0;
    const sort = memoAsync(async (arr: number[]) => {
      visited++;
      const res: number[] = [];
      await Promise.all(
        arr.map(async (a) => {
          await sleep(a * 10);
          res.push(a);
        })
      );
      return res;
    });

    const arr = [3, 1, 2];

    expect(await sort(arr)).toEqual([1, 2, 3]);
    expect(await sort(arr)).toEqual([1, 2, 3]);
    expect(await sort(arr)).toEqual([1, 2, 3]);
    expect(visited).toEqual(1);

    expect(await sort([1, 2, 3])).toEqual([1, 2, 3]);
    expect(await sort([1, 2, 3])).toEqual([1, 2, 3]);
    expect(visited).toEqual(3);
  });
});

function sleep(time: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => res(), time);
  });
}
