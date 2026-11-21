// Тести CI-гейта секретів (T-4807).
// Кожен зразок має позитивний іnegaтивний випадок: гейт мусит червоніти на
// справжньому ключі й не спрацьовувати на плейсхолдері чи звичайному тексті.
// Запуск: `pnpm secrets:test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSecretSource, isScannable } from './check-secrets.mjs';

const run = (text) => checkSecretSource(text, 'file.ts');

test('PEM приватний ключ — порушення', () => {
  const problems = run('-----BEGIN RSA PRIVATE KEY-----\nMIIE...');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /приватний ключ/);
  assert.match(problems[0], /file\.ts:1/);
});

test('AWS access key id — порушення', () => {
  assert.equal(run('aws_access_key_id = "TEST_ACCESS_KEY_ID"').length, 1);
});

test('Google API key — порушення', () => {
  assert.equal(run('const key = "TEST_GOOGLE_API_KEY"').length, 1);
});

test('Slack token — порушення', () => {
  assert.equal(run('SLACK=xoxb-TEST_SLACK_TOKEN').length, 1);
});

test('GitHub token — порушення', () => {
  assert.equal(run('token: ghp_TEST_GITHUB_TOKEN').length, 1);
});

test('Stripe live secret — порушення', () => {
  assert.equal(run('sk_live_TEST_STRIPE_KEY').length, 1);
});

test('плейсхолдер у прикладі — не порушення', () => {
  assert.deepEqual(run('NEXT_REVALIDATE_SECRET=your-secret-token-here'), []);
  assert.deepEqual(run('S3_SECRET_ACCESS_KEY=minioadmin'), []);
});

test('звичайний текст зі словом key — не порушення', () => {
  assert.deepEqual(run('// the api key lives in env, not in code'), []);
});

test('два порушення в різних рядках — обидва видимі', () => {
  const problems = run('x = "TEST_ACCESS_KEY_ID"\ny = "TEST_GOOGLE_API_KEY"');
  assert.equal(problems.length, 2);
  assert.match(problems[0], /:1:/);
  assert.match(problems[1], /:2:/);
});

test('isScannable: службові шляхи поза гейтом', () => {
  assert.equal(isScannable('node_modules/pkg/index.js'), false);
  assert.equal(isScannable('.next/cache/x.js'), false);
  assert.equal(isScannable('vendor/braces/index.js'), false);
  assert.equal(isScannable('scripts/check-secrets.mjs'), false);
  assert.equal(isScannable('.env.example'), false);
});

test('isScannable: бінарні та вихідні файли поза гейтом', () => {
  assert.equal(isScannable('assets/logo.png'), false);
  assert.equal(isScannable('pnpm-lock.yaml'), false);
});

test('isScannable: звичайний код сканується', () => {
  assert.equal(isScannable('apps/api/src/main.ts'), true);
  assert.equal(isScannable('infra/api.Dockerfile'), true);
});