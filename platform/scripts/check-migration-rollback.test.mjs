import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  BASELINE_FILE,
  MIGRATIONS_DIR,
  migrationNames,
  readBaseline,
  scanRollbacks,
} from './check-migration-rollback.mjs';

/** Тимчасове дерево: міграції задаються як `name → вміст rollback.sql | null`. */
function makeRepo(migrations, grandfathered = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-rollback-'));
  for (const [name, rollback] of Object.entries(migrations)) {
    const dir = path.join(root, MIGRATIONS_DIR, name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'migration.sql'), 'SELECT 1;');
    if (rollback !== null) fs.writeFileSync(path.join(dir, 'rollback.sql'), rollback);
  }
  fs.mkdirSync(path.join(root, MIGRATIONS_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MIGRATIONS_DIR, 'migration_lock.toml'),
    'provider = "postgresql"'
  );
  if (grandfathered.length > 0) {
    fs.writeFileSync(path.join(root, BASELINE_FILE), JSON.stringify({ grandfathered }));
  }
  return root;
}

test('міграція з непорожнім rollback проходить', () => {
  const root = makeRepo({ '20260101000000_a': 'DROP TABLE "A";' });
  assert.deepEqual(scanRollbacks(root), []);
});

test('нова міграція без rollback — порушення', () => {
  const root = makeRepo({ '20260101000000_a': null });
  const [problem] = scanRollbacks(root);
  assert.match(problem, /немає rollback\.sql/);
});

test('успадкована міграція з baseline без rollback не ламає гейт', () => {
  const root = makeRepo({ '0_init': null }, ['0_init']);
  assert.deepEqual(scanRollbacks(root), []);
});

test('порожній rollback — порушення', () => {
  const root = makeRepo({ '20260101000000_a': '   \n' });
  assert.match(scanRollbacks(root)[0], /порожній файл/);
});

test('застарілий baseline-запис — порушення, baseline лише звужується', () => {
  const root = makeRepo({ '20260101000000_a': 'DROP TABLE "A";' }, ['0_init']);
  assert.match(scanRollbacks(root)[0], /застарілі записи \(0_init\)/);
});

test('каталог міграцій містить лише підкаталоги, відсортовані', () => {
  const root = makeRepo({ '20260101000000_b': '', '20260101000000_a': '' });
  assert.deepEqual(migrationNames(path.join(root, MIGRATIONS_DIR)), [
    '20260101000000_a',
    '20260101000000_b',
  ]);
});

test('відсутній baseline читається як порожній список', () => {
  const root = makeRepo({ '20260101000000_a': 'DROP TABLE "A";' });
  assert.deepEqual(readBaseline(root), []);
});
