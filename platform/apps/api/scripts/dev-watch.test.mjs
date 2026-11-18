// Unit tests for the dev supervisor's decision table.
// Run: node --test apps/api/scripts/dev-watch.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { decide, parseStatus } from './dev-watch-lib.mjs';

test('no status file → do nothing', () => {
  assert.equal(decide(null, { handledAt: null, serverRunning: false }), 'none');
  assert.equal(decide(null, { handledAt: 5, serverRunning: true }), 'none');
});

test('successful build starts a stopped server and restarts a running one', () => {
  assert.equal(decide({ ok: true, at: 1 }, { handledAt: null, serverRunning: false }), 'start');
  assert.equal(decide({ ok: true, at: 1 }, { handledAt: null, serverRunning: true }), 'restart');
});

test('failed build stops a running server and is a no-op when already stopped', () => {
  assert.equal(decide({ ok: false, at: 1 }, { handledAt: null, serverRunning: true }), 'stop');
  assert.equal(decide({ ok: false, at: 1 }, { handledAt: null, serverRunning: false }), 'none');
});

test('the same status is only handled once', () => {
  assert.equal(decide({ ok: true, at: 7 }, { handledAt: 7, serverRunning: true }), 'none');
  assert.equal(decide({ ok: false, at: 7 }, { handledAt: 7, serverRunning: true }), 'none');
});

test('a status without a numeric timestamp is ignored', () => {
  assert.equal(decide({ ok: true }, { handledAt: null, serverRunning: false }), 'none');
  assert.equal(decide({ ok: false, at: 'x' }, { handledAt: null, serverRunning: true }), 'none');
});

test('parseStatus accepts valid payloads and rejects malformed ones', () => {
  assert.deepEqual(parseStatus('{"ok":true,"at":3}'), { ok: true, at: 3 });
  assert.deepEqual(parseStatus('{"ok":false,"errors":2,"at":4}'), { ok: false, errors: 2, at: 4 });
  assert.equal(parseStatus('not json'), null);
  assert.equal(parseStatus('{"at":3}'), null);
  assert.equal(parseStatus('{"ok":true}'), null);
});

// The guarantee this whole change exists for: a failed rebuild must never
// (re)start a server, no matter what came before.
test('a failed rebuild can never (re)start a server', () => {
  const failed = { ok: false, at: 100 };
  for (const serverRunning of [true, false]) {
    for (const handledAt of [null, 99, 100]) {
      const action = decide(failed, { handledAt, serverRunning });
      assert.notEqual(action, 'start');
      assert.notEqual(action, 'restart');
    }
  }
});
