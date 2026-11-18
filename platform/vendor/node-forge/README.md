# vendor/node-forge

`node-forge@1.4.0` (BSD-3-Clause OR GPL-2.0), trimmed to the Node entrypoint —
`lib/*.js` plus `package.json` and `LICENSE`; the browser bundle in `dist/` and
`flash/` is not shipped. Pinned through `overrides` in `pnpm-workspace.yaml`, so
every consumer resolves this copy instead of the published one.

## Why

`GHSA-86w9-cpqp-85rv` / `CVE-2026-85393` (incomplete fix for `CVE-2026-33894`).
The advisory has **no patched version** — `node-forge@1.4.0` is the newest release
and the upstream fix,
[digitalbazaar/forge#1152](https://github.com/digitalbazaar/forge/pull/1152), is
still unmerged — so an `overrides` version bump cannot resolve it.

The 1.4.0 fix only enforced `obj.value.length === 2` on the outer `DigestInfo`
SEQUENCE. `asn1.validate` ignores children it was not told to expect, so the
nested `DigestAlgorithm` SEQUENCE could still carry interior padding, which
allows RSA PKCS#1 v1.5 signature forgery for low-exponent keys (`e = 3`).

## What changed

`lib/rsa.js`, in the `RSASSA-PKCS1-v1_5` branch of `key.verify`: the nested
`DigestAlgorithm` SEQUENCE must contain only the digest OID plus an optional
`NULL` parameters element (one or two children). This is the change from
upstream PR #1152, expressed with the same `obj.value[0].value.length` access,
plus a guard for the case where the first child carries no child list at all.

`scripts/vendor-forks/node-forge.test.js` reproduces the forgery — a DigestInfo
whose `DigestAlgorithm` holds `[OID, NULL, garbage]` verifies as valid against
upstream 1.4.0 and is rejected after the change.

## Reachability in this repo

`node-forge` is only pulled in transitively by `@expo/cli` /
`@expo/code-signing-certificates` (Expo app code signing and dev-server TLS
certificates). No workspace package imports it directly.

## Removing this

Delete `vendor/node-forge` and the `'node-forge': 'file:./vendor/node-forge'`
line from the `overrides` block in `pnpm-workspace.yaml`, then reinstall — but
only once upstream publishes a release outside the affected range (`> 1.4.0`).
