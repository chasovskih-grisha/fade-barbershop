// Тести гейта «UUID only» (T-4300f, ADR 0021).
//
// Правила мають ловити саме те, що ламає політику, і не ловити сусідні
// легітимні випадки:
//   1) `no-random-uuid` — randomUUID()/crypto.randomUUID()/v4()/uuid.v4();
//      `uuidv7()` зі shared kernel проходить;
//   2) `no-readable-id` — читабельні id (`loc-1`, `loc_KYY_01`, `comp-2`) у
//      ключах `id`/`*Id`, включно з `as Type`; UUID-рядки, allow-список і
//      не-id ключі (`slug`, `code`, `name`) проходять.
//
// Запуск: `pnpm --filter eslint-plugin-uuid-keys test` (node --test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Linter } from 'eslint';

const require = createRequire(import.meta.url);
const plugin = require('./index.js');

const linter = new Linter();
linter.defineRule('uuid-keys/no-random-uuid', plugin.rules['no-random-uuid']);
linter.defineRule('uuid-keys/no-readable-id', plugin.rules['no-readable-id']);

const PARSER_OPTIONS = { ecmaVersion: 2022, sourceType: 'module' };
const UUID_V7 = '0192f1a4-7c3b-7a8e-9b41-2f6d5c8e0a13';

function randomMessages(code) {
  return linter.verify(code, {
    parserOptions: PARSER_OPTIONS,
    rules: { 'uuid-keys/no-random-uuid': 'error' },
  });
}

function idMessages(code, ruleOptions = {}) {
  return linter.verify(code, {
    parserOptions: PARSER_OPTIONS,
    rules: { 'uuid-keys/no-readable-id': ['error', ruleOptions] },
  });
}

// --- no-random-uuid -------------------------------------------------------

test('randomUUID із node:crypto — порушення', () => {
  const code = `import { randomUUID } from 'node:crypto';\nexport const id = randomUUID();`;
  assert.equal(randomMessages(code).length, 1);
});

test('crypto.randomUUID() через глобальний crypto — порушення', () => {
  assert.equal(randomMessages('export const id = crypto.randomUUID();').length, 1);
});

test('v4 із пакета uuid (named, default і namespace) — порушення', () => {
  assert.equal(randomMessages(`import { v4 } from 'uuid';\nexport const id = v4();`).length, 1);
  assert.equal(randomMessages(`import uuid from 'uuid';\nexport const id = uuid.v4();`).length, 1);
  assert.equal(
    randomMessages(`import * as uuid from 'uuid';\nexport const id = uuid.v4();`).length,
    1
  );
});

test('shared kernel uuidv7() — дозволений шлях', () => {
  const code = `import { uuidv7 } from '@fade/domain-shared';\nexport const id = uuidv7();`;
  assert.deepEqual(randomMessages(code), []);
});

test('однойменна локальна функція без імпорту не флагується (немає хибного плюса)', () => {
  assert.deepEqual(
    randomMessages('const randomUUID = () => 1;\nexport const id = randomUUID();'),
    []
  );
});

// --- no-readable-id -------------------------------------------------------

test('читабельні id у id-ключах — порушення', () => {
  const code = [
    `export const a = { id: 'loc-1' };`,
    `export const b = { locationId: 'loc_KYY_01' };`,
    `export const c = { aggregateId: 'apt-1' };`,
    `export const d = { client_id: 'client-9' };`,
  ].join('\n');
  const found = idMessages(code).map((m) => m.message);
  assert.equal(found.length, 4);
  assert.match(found[0], /loc-1/);
  assert.match(found[3], /client-9/);
});

test('`as Type` не ховає читабельний id', () => {
  const code = `type ClientId = string;\nexport const p = { id: 'p-1' as ClientId };`;
  assert.equal(idMessages(code).length, 1);
});

test('UUID-рядки, allow-список і не-id ключі проходять', () => {
  const code = [
    `export const a = { id: '${UUID_V7}' };`,
    `export const b = { id: '0192f1a4-7c3b-4a8e-9b41-2f6d5c8e0a13' };`,
    `export const c = { slug: 'loc-1', code: 'KYY-01', name: 'Fade Podil' };`,
    `export const d = { id: 'booking-123' };`,
  ].join('\n');
  assert.deepEqual(idMessages(code, { allow: ['booking-123'] }), []);
});

test('довільні не-слагові рядки не флагуються (pass-through, не шум)', () => {
  const code = [
    `export const a = { id: '' };`,
    `export const b = { id: 'x' };`,
    `export const c = { id: 'KYY-01' };`,
  ].join('\n');
  assert.deepEqual(idMessages(code), []);
});

test('вкладені об’єкти перевіряються (payload події)', () => {
  const code = `export const e = { payload: { where: { id: 'apt-1' } }, type: 'x' };`;
  assert.equal(idMessages(code).length, 1);
});
