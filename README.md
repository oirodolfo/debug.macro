# About

[debug](https://www.npmjs.com/package/debug) is nice utility for debug logging. This babel macro adds a few opinionated conveniences on top of debug library.

1. Enforces the convention that debug scope is derived from filesystem hierarchy. So `my-package/lib/decorators/foo.js` will automatically use `require('debug')("my-package:lib:decorators:foo")`;
2. Line number & timestamp is prefixed in all debug logs.
3. Utility to debug variable and members expressions without duplication: `debug.vars(a, b.c, d)` compiles to `debug('a:', a, 'b.c:', b.c, 'd:', d)`.
4. Utility (`debug.allInScope()`) to debug all variables declared in block scope (whenever they are initialized or reassigned)
5. Utility (`debug.all()`) to debug all variables in current file.

Examples: [[1]](https://github.com/ts-delight/debug.macro/blob/master/tests/fixtures/index.1.ts), [[2]](https://github.com/ts-delight/debug.macro/blob/master/tests/fixtures/index.2.ts), [[3]](https://github.com/ts-delight/debug.macro/blob/master/tests/fixtures/index.3.ts).

## Installation

This utility is implemented as a [babel-macro](https://github.com/kentcdodds/babel-plugin-macros).

Refer babel's [setup instructions](https://babeljs.io/setup) to learn how to setup your project to use [babel](https://babeljs.io) for compilation. Usage with tsc (only) is not supported.

1. Install `babel-plugin-macros` and `debug.macro`:

```js
npm install --save-dev babel-plugin-macros @ts-delight/debug.macro
```

2. Add babel-plugin-macros to .babelrc (if not already preset):

```js
// .babelrc

module.exports = {
  presets: [
    '@babel/preset-typescript',
    // ... other presets
  ],
  plugins: [
    'babel-plugin-macros',
    // ... other plugins
  ],
};
```

## License

MIT
