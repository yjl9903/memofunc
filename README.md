# memofunc

[![version](https://img.shields.io/npm/v/memofunc?label=memofunc)](https://www.npmjs.com/package/memofunc)
[![CI](https://github.com/yjl9903/memofunc/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/memofunc/actions/workflows/ci.yml)

**Automatically memorize** your function call. Support **any functions** in JavaScript, zero or more parameters, primitive or reference parameters, sync or async.

+ Support sync function and async function
+ Use [Trie](https://en.wikipedia.org/wiki/Trie) to map parameter and its return value
+ Reference object is diffed shallowly with [WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
+ Support custom parameter serializaztion method
+ Support memory and async external cache source at the same time
+ Support fully external cache source

## Installation

```bash
npm i memofunc
```

## Usage

### memoSync

```ts
import { memoSync } from 'memofunc'

const addFn = (a: number, b: number) => a + b

const add = memoSync(add)

console.log(add(1, 2))
```

### memoAsync

It also supports memorize async function call. After invoking once for every specified arguments, the result is located in the local memory.

```ts
import { memoAsync } from 'memofunc'

function sleep(time: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => res(), time);
  });
}

const sort = memoAsync(async (arr: number[]) => {
  // This O(1) sort only run once!
  const res: number[] = [];
  await Promise.all(arr.map(async (a) => {
    await sleep(a * 1000)
    res.push(a)
  }))
  return res;
})

const arr = [3, 1, 2]

console.log(await sort(arr))
console.log(await sort(arr))
console.log(await sort(arr))
```

It also supports memorize **concurrently** async function call.

```ts
import { memoAsync } from 'memofunc'

let count = 0;
const value = memoAsync(async () => {
  // This function also only run once
  await sleep(100);
  return count++;
});

const task1 = value();
const task2 = value();
const task3 = value();

await Promise.all([task1, task2, task3])

// count === 1
```

### memoExternal

The caching mechanism relies on an external asynchronous service and does not store results in the local memory.

Upon invoking the function, it will:

1. It retrieves results from the cache. For concurrent function calls, the cache is queried only once like `memoAsync`;
2. It either returns the cached results or calls the underlying function if the cache is empty.

This approach facilitates the development of caching solutions within distributed systems, such as Cloudflare Workers.

Consider a scenario where the goal of your proxied function is to query database. Once some distributed nodes update the database, you should invalidate the related cache. This ensures that other nodes, relying entirely on the external cache service, will access the latest data available.

```ts
let cnt = 0;
const func = memoExternal(async () => 0, {
  external: {
    async get() {
      await sleep(100);
      return ++cnt;
    },
    async set() {},
    async clear() {
      cnt = 0;
    },
    async remove() {
      cnt = 0;
    }
  }
});

// It will call the external cache get function with cnt = 0
const tasks = await Promise.all([func(), func(), func(), func(), func()]);
expect(tasks).toStrictEqual([1, 1, 1, 1, 1]);

// Clear the cache, cnt = 0
func.clear();

// It will call the external cache get function with cnt = 0
const tasks2 = await Promise.all([func(), func(), func(), func(), func()]);
expect(tasks2).toStrictEqual([1, 1, 1, 1, 1]);
```

## License

MIT License © 2023 [XLor](https://github.com/yjl9903)
