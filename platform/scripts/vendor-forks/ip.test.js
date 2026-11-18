'use strict';

// Regression tests for GHSA-2p57-rm9w-gvfp / CVE-2024-29415: `isPublic` must not
// report a non-routable address as globally routable, whatever literal it was
// written in. The literals below are the ones listed in indutny/node-ip#150.
//
// The module is required by name on purpose: this asserts the copy that
// consumers actually resolve (see the `overrides` block in pnpm-workspace.yaml),
// not the source directory.

const test = require('node:test');
const assert = require('node:assert');

const ip = require('ip');

// [literal, why it is not globally routable]
const NON_ROUTABLE = [
  ['127.0.0.1', 'loopback'],
  ['127.1', 'inet_aton shorthand for 127.0.0.1'],
  ['127.0.1', 'inet_aton shorthand for 127.0.0.1'],
  ['127.00.0x1', 'octal/hex 127.0.0.1'],
  ['127.0.0x0.1', 'octal/hex 127.0.0.1'],
  ['2130706433', '127.0.0.1 as an integer'],
  ['0x7f000001', '127.0.0.1 as a hex integer'],
  ['127.0.0.0x1', '127.0.0.1 with a hex last octet'],
  ['01200034567', '10.0.57.119 as an octal integer'],
  ['012.1.2.3', '10.1.2.3 with an octal first octet'],
  ['10.0.0.1', 'private'],
  ['172.16.0.1', 'private'],
  ['172.31.255.254', 'private'],
  ['192.168.1.1', 'private'],
  ['169.254.1.1', 'link-local'],
  ['100.64.0.1', 'carrier-grade NAT'],
  ['0.0.0.0', 'this network'],
  ['255.255.255.255', 'reserved'],
  ['::', 'unspecified'],
  ['::1', 'loopback'],
  ['000:0:0000::01', '::1 with leading zeros'],
  ['000:0:0000:0:000:0:00:001', '::1 with leading zeros'],
  ['fe80::1', 'link-local'],
  ['fe80::0001', 'link-local with leading zeros'],
  ['fc00::1', 'unique-local'],
  ['fd12:3456::1', 'unique-local'],
  ['ff02::1', 'multicast'],
  ['::ffff:127.0.0.1', 'IPv4-mapped loopback'],
  ['::fFFf:127.0.0.1', 'IPv4-mapped loopback, mixed case'],
  ['::ffff:10.0.0.1', 'IPv4-mapped private'],
];

const GLOBALLY_ROUTABLE = [
  '8.8.8.8',
  '1.1.1.1',
  '93.184.216.34',
  '172.32.0.1',
  '172.15.255.255',
  '192.169.0.1',
  '11.0.0.1',
  '2001:4860:4860::8888',
  '2606:4700:4700::1111',
  '::ffff:8.8.8.8',
];

test('non-routable literals are private and never public', () => {
  for (const [literal, why] of NON_ROUTABLE) {
    assert.equal(ip.isPrivate(literal), true, `isPrivate(${literal}) — ${why}`);
    assert.equal(ip.isPublic(literal), false, `isPublic(${literal}) — ${why}`);
  }
});

test('globally routable literals stay public', () => {
  for (const literal of GLOBALLY_ROUTABLE) {
    assert.equal(ip.isPublic(literal), true, `isPublic(${literal})`);
    assert.equal(ip.isPrivate(literal), false, `isPrivate(${literal})`);
  }
});

test('unparseable input fails closed instead of reading as public', () => {
  const bad = [
    '',
    'not-an-ip',
    '1.2.3.4.5',
    '300.1.1.1',
    '1.2.3.256',
    '0o1200034567',
    '12345678910',
    null,
    42,
  ];

  for (const literal of bad) {
    assert.throws(() => ip.isPublic(literal), Error, `isPublic(${String(literal)}) must throw`);
    assert.throws(() => ip.isPrivate(literal), Error, `isPrivate(${String(literal)}) must throw`);
  }
});

test('inet_aton shorthand forms still normalize like inet_aton', () => {
  assert.equal(ip.isPrivate('10.1'), true); // 10.0.0.1
  assert.equal(ip.isPrivate('127.2'), true); // 127.0.0.2
  assert.equal(ip.isPublic('1.2.3'), true); // 1.2.0.3, genuinely public
  assert.equal(ip.isPublic('8.8'), true); // 8.0.0.8
});

test('isLoopback is total and keeps upstream answers', () => {
  for (const literal of [
    '127.0.0.1',
    '127.1',
    '0177.0.1',
    '0x7f.1',
    '2130706433',
    '::1',
    '::',
    'fe80::1',
  ]) {
    assert.equal(ip.isLoopback(literal), true, `isLoopback(${literal})`);
  }

  for (const literal of ['192.168.1.1', '8.8.8.8', 'fe80::2', 'not-an-ip', '']) {
    assert.equal(ip.isLoopback(literal), false, `isLoopback(${literal})`);
  }
});

test('normalizeToLong rejects values outside the IPv4 range', () => {
  assert.equal(ip.normalizeToLong('2130706433'), 2130706433);
  assert.equal(ip.normalizeToLong('12345678910'), -1);
  assert.equal(ip.normalizeToLong('0o1200034567'), -1);
  assert.equal(ip.normalizeToLong(42), -1);
});

test('the rest of the API is unchanged', () => {
  assert.equal(ip.isV4Format('1.2.3.4'), true);
  assert.equal(ip.isV6Format('::ffff:127.0.0.1'), true);
  assert.equal(ip.toString(ip.toBuffer('10.0.0.1')), '10.0.0.1');
  assert.equal(ip.toLong('127.0.0.1'), 2130706433);
  assert.equal(ip.fromLong(2130706433), '127.0.0.1');
  assert.equal(ip.cidrSubnet('192.168.1.134/26').contains('192.168.1.190'), true);
  assert.equal(ip.isEqual('127.0.0.1', '::ffff:127.0.0.1'), true);
  assert.equal(ip.address() !== undefined, true);
});
