# memofunc

## Installation

```bash
npm i memofunc
```

## Usage

```ts
import { memo } from 'memofunc'

const addFn = (a: number, b: number) => a + b

const add = memo(add);

console.log(add(1, 2))
```

## License

MIT License © 2023 [XLor](https://github.com/yjl9903)
