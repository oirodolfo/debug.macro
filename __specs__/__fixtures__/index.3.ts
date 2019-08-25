import debug from '../../debug.macro';

debug.all();

function foo(): any {
  const a = { a: 10 };
  function bar() {
    const b = { b: { c: { d: 100 } } };
    let d = foo();
    var c = 20;
    c = 30;
  }
  const c = foo();
  return c;
}
