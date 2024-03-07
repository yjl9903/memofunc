import { describe, it, expect } from 'vitest';

import { memo, memoAsync, memoExternal } from '../src';

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

  it('should serialize', () => {
    const add = memo(
      (a: number, b: number) => {
        return a + b;
      },
      {
        serialize(a, b) {
          expect(this).toBe(add);
          return [a];
        }
      }
    );

    expect(add(1, 1)).toBe(2);
    expect(add(1, 2)).toBe(2);
    expect(add(1, 3)).toBe(2);
    expect(add(1, 4)).toBe(2);
    expect(add(1, 5)).toBe(2);
    expect(add(2, 1)).toBe(3);
    expect(add(2, 2)).toBe(3);
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

describe('memo external', () => {
  it('should prefer external cache', async () => {
    const func = memoExternal(async () => 1, {
      external: {
        async get() {
          return 2;
        },
        async set() {},
        async remove() {}
      }
    });

    expect(await func()).toBe(2);
    expect(await func()).toBe(2);
    expect(await func()).toBe(2);
    expect(await func()).toBe(2);
  });

  it('should skip external cache', async () => {
    let cnt = 0;
    const func = memoExternal(async () => ++cnt, {
      external: {
        async get() {
          return undefined;
        },
        async set() {},
        async remove() {}
      }
    });

    expect(await func()).toBe(1);
    expect(await func()).toBe(2);
    expect(await func()).toBe(3);
    expect(await func()).toBe(4);
  });

  it('should get external cache once', async () => {
    let cnt = 0;
    const func = memoExternal(async () => ++cnt, {
      external: {
        async get() {
          await sleep(100);
          return undefined;
        },
        async set() {},
        async remove() {}
      }
    });

    const tasks = await Promise.all([func(), func(), func(), func(), func()]);
    expect(tasks).toStrictEqual([1, 1, 1, 1, 1]);
  });

  it('should get external cache twice', async () => {
    let cnt = 0;
    const func = memoExternal(async () => ++cnt, {
      external: {
        async get() {
          await sleep(100);
          return undefined;
        },
        async set() {},
        async remove() {}
      }
    });

    const tasks = await Promise.all([func(), func(), func(), func(), func()]);
    expect(tasks).toStrictEqual([1, 1, 1, 1, 1]);

    const tasks2 = await Promise.all([func(), func(), func(), func(), func()]);
    expect(tasks2).toStrictEqual([2, 2, 2, 2, 2]);
  });

  it('should get external cache after removing', async () => {
    let cnt = 0;
    const func = memoExternal(async () => 0, {
      external: {
        async get() {
          await sleep(100);
          return ++cnt;
        },
        async set() {},
        async remove() {
          cnt = 0;
        }
      }
    });

    const tasks = await Promise.all([func(), func(), func(), func(), func()]);
    expect(tasks).toStrictEqual([1, 1, 1, 1, 1]);

    await func.remove();

    const tasks2 = await Promise.all([func(), func(), func(), func(), func()]);
    expect(tasks2).toStrictEqual([1, 1, 1, 1, 1]);
  });

  it('should not interleave get and remove external cache', async () => {
    let cnt = 0;
    const func = memoExternal(async () => 0, {
      external: {
        async get() {
          await sleep(200);
          return ++cnt;
        },
        async set() {},
        async remove() {
          await sleep(100);
          cnt = 0;
        }
      }
    });

    const tasks = await Promise.all([
      func(),
      func.remove(),
      func(),
      func(),
      func(),
      func.remove(),
      func()
    ]);
    expect(tasks).toStrictEqual([1, undefined, 1, 1, 1, undefined, 1]);
    expect(cnt).toBe(0);

    cnt = 10;
    const tasks2 = await Promise.all([
      func.remove(),
      func(),
      func(),
      func(),
      func.remove(),
      func(),
      func()
    ]);
    expect(tasks2).toStrictEqual([undefined, 1, 2, 3, undefined, 4, 5]);
  });
});

function sleep(time: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => res(), time);
  });
}
