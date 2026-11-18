# vendor/ip

A byte-for-byte copy of `ip@1.1.9` (`node_modules/ip/lib/ip.js`, MIT) with the
`isPublic` misclassification fixed. Pinned through `overrides` in
`pnpm-workspace.yaml`, so every consumer resolves this copy instead of the
published one.

## Why

`GHSA-2p57-rm9w-gvfp` / `CVE-2024-29415` (incomplete fix for `CVE-2023-42282`).
The advisory has **no patched version** — `ip@2.0.1` is the newest release and is
still affected — so an `overrides` version bump cannot resolve it. Upstream is
unmaintained; the tracking issue is
[indutny/node-ip#150](https://github.com/indutny/node-ip/issues/150).

`isPrivate`/`isPublic` are used as SSRF guards, so an address that reaches a
private network being reported as "globally routable" is a real security bug.

## What changed

Upstream classified the *raw* literal with regexes. It ran the loopback check
before normalizing, and it skipped normalization entirely for anything that
matched its very loose IPv6 regex — so these all answered `isPublic(addr) === true`:

| Literal | Actually | Was |
| --- | --- | --- |
| `127.1`, `127.0.1` | `127.0.0.1` (inet_aton shorthand) | public |
| `127.00.0x1`, `127.0.0x0.1` | `127.0.0.1` (octal/hex octets) | public |
| `01200034567` | `10.0.57.119` (octal big-integer) | public |
| `012.1.2.3` | `10.1.2.3` (octal first octet) | public |
| `fe80::0001`, `000:0:0000::01` | `fe80::1`, `::1` | public |
| `::fFFf:127.0.0.1` | IPv4-mapped loopback | public |

`lib/ip.js` now canonicalizes every accepted literal to a 4-byte IPv4 address or
eight IPv6 groups before classifying, and the classification covers the address
blocks that are not globally routable (0/8, 10/8, 100.64/10, 127/8, 169.254/16,
172.16/12, 192.168/16, 224/4, 240/4, plus `::`, `::1`, `fc00::/7`, `fe80::/10`,
`ff00::/8`). An IPv4-mapped address inherits the verdict of the IPv4 address it
carries, so `::ffff:127.0.0.1` is private and `::ffff:8.8.8.8` is public.

Unparseable input now throws from `isPrivate`/`isPublic` (fail closed) instead of
being reported as public. `isLoopback` stays total and never throws, because
`ip.address()` probes every interface address through it.

The public API is otherwise untouched: `isV4Format`, `isV6Format`, `toBuffer`,
`mask`, `subnet`, `toLong`, `fromLong` and `normalizeToLong` keep their previous
behaviour, apart from two input-validation guards in `normalizeToLong` (a
non-string argument, and a single-part value above `0xffffffff`).

`scripts/vendor-forks/ip.test.js` is the regression suite; run it with
`pnpm vendor:test`.

## Removing this

Delete `vendor/ip` and the `'ip': 'file:./vendor/ip'` line from the `overrides`
block in `pnpm-workspace.yaml`, then reinstall — but only once upstream publishes
a release outside the affected range (`> 2.0.1`).
