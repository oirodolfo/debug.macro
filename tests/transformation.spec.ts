import * as path from 'path';
import { transformFileSync } from '@babel/core';

test('Transformations', () => {
  expect(transformFileSync(path.join(__dirname, 'fixtures/index.1.ts'))!.code)
    .toMatchInlineSnapshot(`
    "\\"use strict\\";

    var _debug = _interopRequireWildcard(require(\\"debug\\"));

    function _getRequireWildcardCache() { if (typeof WeakMap !== \\"function\\") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

    function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== \\"object\\" && typeof obj !== \\"function\\") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

    const _debug2 = _debug(\\"debug.macro:tests:fixtures:index\\");

    debug(\`[@:\${Date.now()}]\`, \\"[L:3]\\", 'foo');
    const a = 1;
    const b = {
      a: 10,
      b: {
        c: ['hello', 'world']
      }
    };

    _debug2(\`[@:\${Date.now()}]\`, \\"[L:7]\\", \\"a :\\", a, \\"b.b.c :\\", b.b.c);

    function foo() {
      const c = [1, 2, 3];

      _debug2(\`[@:\${Date.now()}]\`, \\"[L:11]\\", \\"c :\\", c, \\"c :\\", c, \\"a :\\", a, \\"b :\\", b);
    }"
  `);
  expect(transformFileSync(path.join(__dirname, 'fixtures/index.2.ts'))!.code)
    .toMatchInlineSnapshot(`
    "\\"use strict\\";

    var _debug = _interopRequireWildcard(require(\\"debug\\"));

    function _getRequireWildcardCache() { if (typeof WeakMap !== \\"function\\") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

    function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== \\"object\\" && typeof obj !== \\"function\\") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

    const _debug2 = _debug(\\"debug.macro:tests:fixtures:index\\");

    function foo() {
      const a = {
        a: 10
      };

      function bar() {
        debug.allInScope();
        const b = {
          b: {
            c: {
              d: 100
            }
          }
        };

        _debug2(\`[@:\${Date.now()}]\`, \\"[L:5]\\", \\"b :\\", b);

        let d = foo();

        _debug2(\`[@:\${Date.now()}]\`, \\"[L:5]\\", \\"d :\\", d);

        var c = 20;

        _debug2(\`[@:\${Date.now()}]\`, \\"[L:5]\\", \\"c :\\", c);

        c = 30;

        _debug2(\`[@:\${Date.now()}]\`, \\"[L:5]\\", \\"c :\\", c)
      }

      const c = foo();
      return c;
    }"
  `);
  expect(transformFileSync(path.join(__dirname, 'fixtures/index.3.ts'))!.code)
    .toMatchInlineSnapshot(`
    "\\"use strict\\";

    var _debug = _interopRequireWildcard(require(\\"debug\\"));

    function _getRequireWildcardCache() { if (typeof WeakMap !== \\"function\\") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

    function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== \\"object\\" && typeof obj !== \\"function\\") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

    const _debug2 = _debug(\\"debug.macro:tests:fixtures:index\\");

    _debug2(\`[@:\${Date.now()}]\`, \\"[L:1]\\", \\"_debug2 :\\", _debug2);

    debug.all();

    function foo() {
      const a = {
        a: 10
      };

      _debug2(\`[@:\${Date.now()}]\`, \\"[L:5]\\", \\"a :\\", a);

      function bar() {
        const b = {
          b: {
            c: {
              d: 100
            }
          }
        };

        _debug2(\`[@:\${Date.now()}]\`, \\"[L:7]\\", \\"b :\\", b);

        let d = foo();

        _debug2(\`[@:\${Date.now()}]\`, \\"[L:7]\\", \\"d :\\", d);

        var c = 20;

        _debug2(\`[@:\${Date.now()}]\`, \\"[L:7]\\", \\"c :\\", c);

        c = 30;

        _debug2(\`[@:\${Date.now()}]\`, \\"[L:7]\\", \\"c :\\", c)
      }

      const c = foo();

      _debug2(\`[@:\${Date.now()}]\`, \\"[L:5]\\", \\"c :\\", c);

      return c;
    }"
  `);
});
