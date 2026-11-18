# vendor/ — local forks of dependencies with no patched release

Three dependencies had open `high` advisories that no install-time version bump
can clear, because **the advisory lists no patched version at all** — the newest
published release is itself the affected one. Each is fixed here instead, from
the upstream source, and pinned so consumers resolve the fork:

| Package | Advisory | Upstream status | Vendored as |
| --- | --- | --- | --- |
| `ip` | `GHSA-2p57-rm9w-gvfp` | unmaintained; `2.0.1` still affected | `2.0.2` |
| `braces` | `GHSA-vfj7-8cjw-p6xm` | no fix on `master`; `3.0.3` still affected | `3.0.4` |
| `node-forge` | `GHSA-86w9-cpqp-85rv` | fix unmerged; `1.4.0` still affected | `1.4.1` |

Each directory has its own README: what the fix is, why it is needed, and the
exact steps to delete the fork once upstream ships a release.

## How the pinning works

Three pieces, all of them needed:

1. `pnpm-workspace.yaml` → `overrides` maps each name to `file:./vendor/<name>`.
   This is what makes every transitive consumer resolve the fork; `pnpm audit`
   reads the resolved versions, so the fork's bumped version is what clears the
   advisory.
2. Root `package.json` → the same three `file:` entries in `devDependencies`.
   Strictly a test convenience, so `scripts/vendor-forks/*` can `require` the
   package by name and assert the copy consumers actually get.
3. `.prettierignore` → `vendor/` is third-party code kept byte-for-byte close to
   upstream so the fix diffs stay readable. It is not formatted or linted.

`pnpm-lock.yaml` is committed and CI installs with `--frozen-lockfile`, so a
change under `vendor/` must be accompanied by a fresh `pnpm install` then.

## Tests

`pnpm vendor:test` (`scripts/vendor-forks/*.test.js`, also a CI step) holds the
regression tests: the `isPublic` misclassification literals, the nesting-depth
DoS, and a reproduced RSA PKCS#1 v1.5 signature forgery.
