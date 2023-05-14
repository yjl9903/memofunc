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

## License

MIT License © 2023 [XLor](https://github.com/yjl9903)
