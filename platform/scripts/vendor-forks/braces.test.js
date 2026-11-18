'use strict';

const test = require('node:test');
const assert = require('node:assert');

const braces = require('braces');

// `'{'.repeat(n)` nests n levels: each `{` opens another brace block.
const nested = (depth) => '{'.repeat(depth) + 'a' + '}'.repeat(depth);

function deepAst(depth) {
  let node = { type: 'text', value: 'x' };
  for (let i = 0; i < depth; i++) {
    node = { type: 'brace', nodes: [node] };
  }
  return { type: 'root', nodes: [node] };
}

test('legitimate patterns expand unchanged', () => {
  assert.deepEqual(braces('a/{b,c}/d'), ['a/(b|c)/d']);
  assert.deepEqual(braces.expand('a/{b,c}/d'), ['a/b/d', 'a/c/d']);
  assert.deepEqual(braces.expand('{1..3}'), ['1', '2', '3']);
  assert.deepEqual(braces.expand('{a,b{1..2}}'), ['a', 'b1', 'b2']);
  assert.deepEqual(braces('').concat([]), ['']);
});

test('nesting below the limit is accepted', () => {
  assert.doesNotThrow(() => braces(nested(50)));
});

test('a deeply nested pattern throws a catchable error, not a stack overflow', () => {
  for (const depth of [3500, 5000]) {
    assert.throws(
      () => braces(nested(depth)),
      (error) => {
        assert.ok(
          error instanceof SyntaxError,
          `expected SyntaxError, got ${error.name}: ${error.message}`
        );
        assert.doesNotMatch(error.message, /call stack/i);
        return true;
      },
      `depth ${depth} must be rejected by the depth guard`
    );
  }
});

test('the expand path is guarded too', () => {
  assert.throws(() => braces.expand(nested(5000)), SyntaxError);
});

test('maxDepth is configurable per call', () => {
  assert.throws(() => braces(nested(5), { maxDepth: 3 }), SyntaxError);
  assert.doesNotThrow(() => braces(nested(5), { maxDepth: 10 }));
});

test('compile and expand bound an AST that did not come from parse', () => {
  assert.throws(() => braces.compile(deepAst(200)), SyntaxError);
  assert.throws(() => braces.expand(deepAst(200)), SyntaxError);
  assert.doesNotThrow(() => braces.compile(deepAst(5)));
  assert.doesNotThrow(() => braces.expand(deepAst(5)));
});
