# memofunc

[![version](https://img.shields.io/npm/v/memofunc?label=memofunc)](https://www.npmjs.com/package/memofunc)
[![CI](https://github.com/yjl9903/memofunc/actions/workflows/ci.yml/badge.svg)](https://github.com/yjl9903/memofunc/actions/workflows/ci.yml)

## Installation

```bash
npm i memofunc
```

## Usage

```ts
import { memoSync } from 'memofunc'

const addFn = (a: number, b: number) => a + b

const add = memoSync(add);

console.log(add(1, 2))
```

It also supports memorize async function call.

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

## License

MIT License © 2023 [XLor](https://github.com/yjl9903)
