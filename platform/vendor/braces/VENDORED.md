# Why this directory exists

A copy of `braces@3.0.3` (MIT, see the upstream `README.md` next to this file)
with a nesting-depth guard added. Pinned through `overrides` in
`pnpm-workspace.yaml`, so every consumer resolves this copy instead of the
published one.

## The advisory

`GHSA-vfj7-8cjw-p6xm` / `CVE-2026-93687`. There is **no patched version** —
`braces@3.0.3` is the newest release and there is no fix on `master` (upstream
argues the character cap is sufficient; see
[micromatch/braces#70](https://github.com/micromatch/braces/issues/70)) — so an
`overrides` version bump cannot resolve it.

`parse()` bounded only the number of characters (`MAX_LENGTH = 10000`), not brace
nesting depth. Each nested `{` costs one stack frame in the recursive AST walkers
in `lib/compile.js` and `lib/expand.js`, so a pattern of a few thousand nested
braces — well under the character cap — exhausts the call stack and kills the
process with an uncaught `RangeError: Maximum call stack size exceeded`.

## What changed

- `lib/constants.js` gains `MAX_DEPTH = 100`. Real patterns nest a handful of
  levels; 100 is far below the depth at which the walkers blow the stack.
- `lib/parse.js` throws a `SyntaxError` once nesting exceeds `maxDepth` (default
  `MAX_DEPTH`, overridable per call with `options.maxDepth`), which bounds every
  downstream walker at the source.
- `lib/compile.js` and `lib/expand.js` also count depth in their own `walk`, so
  an AST that did not come from `parse` (built by hand, or cached) is bounded
  too. `stringify` is left alone: its frames are light enough to survive the
  character cap, so it is not an exploitable sink.

Inputs that previously crashed the process now throw a catchable `SyntaxError`,
and legitimate patterns expand exactly as before
(`scripts/vendor-forks/braces.test.js`).

## Removing this

Delete `vendor/braces` and the `'braces': 'file:./vendor/braces'` line from the
`overrides` block in `pnpm-workspace.yaml`, then reinstall — but only once
upstream publishes a release outside the affected range (`> 3.0.3`).
