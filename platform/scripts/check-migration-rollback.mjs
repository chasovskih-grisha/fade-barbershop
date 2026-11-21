#!/usr/bin/env node
// T-4209 · CI-гейт зворотного ходу міграцій (rollback coverage).
//
// `check-migration-safety.mjs` не дає покласти прод падаючою зміною наперед.
// Цей гейт закриває інший бік: коли деплой уже стався і його треба відкотити,
// для міграції мусить існувати `rollback.sql` поруч із `migration.sql`.
// Міграції, застосовані до появи гейта, зафіксовані у baseline — вони
// «успадковані» без rollback, і гейт їх не переписує (expand/contract — T-4209).
//
// Запуск: `pnpm db:migration:rollback:check`. Тести: `pnpm db:migration:rollback:test`.
// Вивід: `path: message`, exit 1 на будь-яке порушення.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Каталог з міграціями Prisma, відносно кореня репозиторію. */
export const MIGRATIONS_DIR = 'apps/api/prisma/migrations';

/** Baseline: міграції до гейта. `null` — усі наявні вважаються успадкованими. */
export const BASELINE_FILE = `${MIGRATIONS_DIR}/rollback-baseline.json`;

/** Назви каталогів міграцій (пропускає `migration_lock.toml` і baseline). */
export function migrationNames(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** Читає baseline; відсутній файл = порожній список. */
export function readBaseline(root) {
  const file = path.join(root, BASELINE_FILE);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8')).grandfathered ?? [];
}

/**
 * Перевіряє одну міграцію. Повертає текст проблеми або `null`.
 * Успадкована міграція без rollback — не порушення; наявний rollback мусить бути непорожнім.
 */
export function checkMigration(root, name, grandfathered) {
  const dir = path.join(root, MIGRATIONS_DIR, name);
  const rollback = path.join(dir, 'rollback.sql');
  const hasRollback = fs.existsSync(rollback);
  if (!hasRollback) {
    if (grandfathered.includes(name)) return null;
    return (
      `${MIGRATIONS_DIR}/${name}: немає rollback.sql — відкат деплою неможливий; ` +
      'додати зворотні SQL-кроки поруч із migration.sql (T-4209)'
    );
  }
  if (fs.readFileSync(rollback, 'utf8').trim() === '') {
    return `${MIGRATIONS_DIR}/${name}/rollback.sql: порожній файл — це не відкат`;
  }
  return null;
}

/** Сканує каталог міграцій; повертає список порушень з відносними шляхами. */
export function scanRollbacks(root) {
  const grandfathered = readBaseline(root);
  const names = migrationNames(path.join(root, MIGRATIONS_DIR));
  const problems = names
    .map((name) => checkMigration(root, name, grandfathered))
    .filter((problem) => problem !== null);
  const stale = grandfathered.filter((name) => !names.includes(name));
  if (stale.length > 0) {
    problems.push(
      `${BASELINE_FILE}: застарілі записи (${stale.join(', ')}) — baseline лише звужується`
    );
  }
  return problems;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const problems = scanRollbacks(root);
  if (problems.length > 0) {
    console.error(`Гейт rollback міграцій (T-4209): ${problems.length} порушень\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log('Гейт rollback міграцій (T-4209): чисто — кожна нова міграція має rollback.sql.');
}
