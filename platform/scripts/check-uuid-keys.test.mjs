// Тести CI-гейта «UUID only» (T-4300f, ADR 0021).
//
// Фікстурні схеми/файли збираються в тимчасовій теці, щоб не залежати від
// реального коду: гейт мусить червоніти на порушенні й зеленіти на
// дозволеному винятку. Запуск: `pnpm uuid:test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  checkCodeSource,
  checkPrismaSource,
  isIdGenerationPath,
  isTestOrSeedPath,
  scanProject,
} from './check-uuid-keys.mjs';

const UUID_V7 = '0192f1a4-7c3b-7a8e-9b41-2f6d5c8e0a13';

const schema = (fields) => `model User {\n${fields}\n}\n`;

test('Prisma: String @id @db.Uuid проходить', () => {
  assert.deepEqual(checkPrismaSource(schema('  id String @id @db.Uuid\n  phone String')), []);
});

test('Prisma: Int PK — порушення', () => {
  const problems = checkPrismaSource(schema('  id Int @id @default(autoincrement())'));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Int\/BigInt PK/);
  assert.match(problems[0], /schema\.prisma:2/);
});

test('Prisma: autoincrement на String PK — порушення', () => {
  const problems = checkPrismaSource(schema('  id String @id @default(autoincrement())'));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /autoincrement\(\)/);
});

test('Prisma: DB-дефолт uuid() — порушення (генерація лише в коді)', () => {
  const problems = checkPrismaSource(schema('  id String @id @default(uuid()) @db.Uuid'));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /DB-дефолт/);
});

test('Prisma: String PK без @db.Uuid — порушення', () => {
  const problems = checkPrismaSource(schema('  id String @id'));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /PK без @db\.Uuid/);
});

test('Prisma: складений @@id — порушення', () => {
  const problems = checkPrismaSource('model Pair {\n  a String\n  b String\n  @@id([a, b])\n}\n');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /@@id/);
});

test('Prisma: allowlist інфраструктурної таблиці діє', () => {
  assert.deepEqual(
    checkPrismaSource('model AppSetting {\n  key String @id\n  value Json\n}\n'),
    []
  );
});

test('код: читабельний id у полі id/*Id — порушення', () => {
  const problems = checkCodeSource(`const a = { id: 'loc-1' };\n`, 'src/x/domain/a.ts');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /loc-1/);
  assert.match(problems[0], /:1:/);
});

test('код: UUID, не-id ключі й allowlist проходять', () => {
  const code = [
    `const a = { id: '${UUID_V7}' };`,
    `const b = { slug: 'loc-1', code: 'KYY-01' };`,
    `const c = { id: 'booking-123' };`,
  ].join('\n');
  assert.deepEqual(checkCodeSource(code, 'src/x/application/a.ts'), []);
});

test('код: randomUUID/v4 у domain/application — порушення, uuidv7 — ні', () => {
  const bad = checkCodeSource(
    `import { randomUUID } from 'node:crypto';\nconst id = randomUUID();`,
    'src/x/domain/a.ts'
  );
  assert.equal(bad.length, 1);
  assert.match(bad[0], /uuidv7/);

  const badV4 = checkCodeSource(`const id = uuid.v4();`, 'src/x/application/gen.ts');
  assert.equal(badV4.length, 1);

  const good = checkCodeSource(
    `import { uuidv7 } from '@fade/domain-shared';\nconst id = uuidv7();`,
    'src/x/application/a.ts'
  );
  assert.deepEqual(good, []);
});

test('код: тестові двійники й сіди поза гейтом', () => {
  const line = `const a = { id: 'loc-1' };\nconst b = randomUUID();`;
  for (const file of [
    'src/x/domain/a.spec.ts',
    'src/x/e2e/a.ts',
    'src/x/application/a.fakes.ts',
    'src/seed-customers.ts',
    'src/x/application/a.env.ts',
    'src/x/application/a-setup.ts',
  ]) {
    assert.deepEqual(checkCodeSource(line, file), [], file);
  }
});

test('допоміжні предикати: шляхи генерації id і тестів', () => {
  assert.equal(isIdGenerationPath('src/crm/domain/client.ts'), true);
  assert.equal(isIdGenerationPath('src/crm/application/create.ts'), true);
  assert.equal(isIdGenerationPath('src/locations/infrastructure/uuid-id-generator.ts'), true);
  assert.equal(isIdGenerationPath('src/shared/logging/x.ts'), false);
  assert.equal(isTestOrSeedPath('src/crm/domain/client.spec.ts'), true);
  assert.equal(isTestOrSeedPath('src/crm/domain/client.ts'), false);
});

test('scanProject: реальна схема чиста, порушення у фікстурі — червоне', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'uuid-gate-'));
  const schemaDir = path.join(root, 'apps/api/prisma');
  fs.mkdirSync(schemaDir, { recursive: true });
  fs.writeFileSync(
    path.join(schemaDir, 'schema.prisma'),
    'model Ok {\n  id String @id @db.Uuid\n}\n'
  );
  fs.mkdirSync(path.join(root, 'apps/api/src/domain'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'apps/api/src/domain/bad.ts'),
    `export const x = { id: 'loc-1' };\n`
  );

  const problems = scanProject(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /bad\.ts:1/);
  assert.match(problems[0], /loc-1/);
});
