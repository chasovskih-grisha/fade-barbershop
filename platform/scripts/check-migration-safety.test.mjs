// Тести CI-гейта безпеки міграцій (T-4812).
//
// Фікстурні SQL-рядки тримають кожне правило окремо: гейт мусить червоніти на
// небезпечній операції й зеленіти на безпечному expand-кроці. Запуск:
// `pnpm db:migration:test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkMigrationSql, splitStatements } from './check-migration-safety.mjs';

const run = (sql) => checkMigrationSql(sql, 'migration.sql', 'test_migration');

test('DROP TABLE — порушення', () => {
  const problems = run('DROP TABLE "Old";');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /DROP TABLE/);
  assert.match(problems[0], /migration\.sql:1/);
});

test('DROP COLUMN — порушення', () => {
  const problems = run('ALTER TABLE "Booking" DROP COLUMN "legacy";');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /DROP COLUMN/);
});

test('RENAME COLUMN — порушення', () => {
  assert.equal(run('ALTER TABLE "User" RENAME COLUMN "a" TO "b";').length, 1);
});

test('TRUNCATE і DELETE FROM — порушення', () => {
  assert.equal(run('TRUNCATE "Booking";').length, 1);
  assert.equal(run('DELETE FROM "Booking" WHERE "status" = \'x\';').length, 1);
});

test('SET NOT NULL — порушення', () => {
  assert.equal(run('ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;').length, 1);
});

test('ADD COLUMN ... NOT NULL без DEFAULT — порушення', () => {
  const problems = run('ALTER TABLE "Booking" ADD COLUMN "source" TEXT NOT NULL;');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /NOT NULL без DEFAULT/);
});

test('ADD COLUMN ... NOT NULL DEFAULT — безпечно (backfill одним кроком)', () => {
  assert.deepEqual(
    run('ALTER TABLE "Booking" ADD COLUMN "source" TEXT NOT NULL DEFAULT \'web\';'),
    []
  );
});

test('ADD COLUMN nullable — безпечно (expand)', () => {
  assert.deepEqual(run('ALTER TABLE "Booking" ADD COLUMN "comment" TEXT;'), []);
});

test('ADD COLUMN IF NOT EXISTS nullable — безпечно', () => {
  assert.deepEqual(run('ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "slug" TEXT;'), []);
});

test('CREATE TABLE і CREATE INDEX — безпечно', () => {
  const sql =
    'CREATE TABLE "ClientProfile" ("id" UUID NOT NULL);\nCREATE INDEX "x_idx" ON "ClientProfile" ("id");';
  assert.deepEqual(run(sql), []);
});

test('ALTER COLUMN TYPE — безпечно (гейт ловить лише руйнівні операції)', () => {
  assert.deepEqual(
    run('ALTER TABLE "OutboxMessage" ALTER COLUMN "at" SET DATA TYPE TIMESTAMPTZ;'),
    []
  );
});

test('номер рядка вказує на початок небезпечного оператора', () => {
  const sql = '-- comment\nCREATE TABLE "A" ("id" UUID);\nDROP TABLE "B";';
  const problems = run(sql);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /migration\.sql:3/);
});

test('splitStatements повертає оператор і рядок початку', () => {
  const parts = splitStatements('A;\nB;');
  assert.equal(parts.length, 2);
  assert.deepEqual(
    parts.map((p) => p.line),
    [1, 2]
  );
});
