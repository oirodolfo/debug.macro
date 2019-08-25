import debug from '../../debug.macro';

debug('foo');

const a = 1;
const b = { a: 10, b: { c: ['hello', 'world'] }};
debug.vars(a, b.b.c);

function foo() {
  const c = [1, 2, 3];
  debug.vars(c, c, a, b);  
}
