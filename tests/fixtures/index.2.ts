import debug from '../../lib/debug.macro';

function foo(): any {
  const a = { a: 10 };
  function bar() {
    debug.allInScope();
    const b = { b: { c: { d: 100 } } };
    let d = foo();
    var c = 20;
    c = 30;
  }
  const c = foo();
  return c;
}
