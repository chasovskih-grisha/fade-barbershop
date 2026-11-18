#!/usr/bin/env node
// T-4812 · CI-гейт безпеки Prisma-міграцій (zero-downtime deploy).
//
// Міграція, що проходить локально, може покласти прод під час rolling deploy:
// падаюча зміна ламає старі інстанси API, які ще читають попередню схему.
// Гейт сканує SQL у apps/api/prisma/migrations на операції, які вимагають
// expand/contract замість одного кроку (ADR 0021, engineering-principles.md).
//
// Запуск: `pnpm db:migration:check` (з platform/). Тести: `pnpm db:migration:test`.
// Вивід: `path:line: message`, exit 1 на будь-яке порушення. Виняток — рядком
// у ALLOWLIST з причиною, а не вимкненням перевірки.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Каталог з міграціями Prisma, відносно кореня репозиторію. */
export const MIGRATIONS_DIR = 'apps/api/prisma/migrations';

/**
 * Винятки: `${migrationName}:${ruleId}` → причина. Порожній — усі міграції
 * чисто проходять політику. Новий виняток додається свідомо, з поясненням.
 */
export const ALLOWLIST = new Map();

/**
 * Правила рівня оператора: деструктивні або такі, що ламають старий інстанс.
 * `expand` (додати) безпечно; `contract` (прибрати) — окремою міграцією після
 * випуску коду, який більше не читає поле.
 */
const RULES = [
  { id: 'drop-table', re: /\bDROP\s+TABLE\b/i, what: 'DROP TABLE' },
  { id: 'drop-column', re: /\bDROP\s+COLUMN\b/i, what: 'DROP COLUMN' },
  { id: 'truncate', re: /\bTRUNCATE\b/i, what: 'TRUNCATE' },
  { id: 'delete-from', re: /\bDELETE\s+FROM\b/i, what: 'DELETE FROM' },
  { id: 'rename', re: /\bRENAME\s+(?:COLUMN|CONSTRAINT|TO)\b/i, what: 'RENAME' },
  { id: 'set-not-null', re: /\bSET\s+NOT\s+NULL\b/i, what: 'SET NOT NULL' },
];

/** Розбиває SQL на оператори `;`, зберігаючи номер рядка початку. */
export function splitStatements(text) {
  const out = [];
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== ';') continue;
    const raw = text.slice(start, i + 1);
    const lead = raw.search(/\S/);
    const offset = start + (lead === -1 ? 0 : lead);
    const line = text.slice(0, offset).split('\n').length;
    out.push({ sql: raw, line });
    start = i + 1;
  }
  return out;
}

/**
 * `ADD COLUMN ... NOT NULL` без `DEFAULT` падає на непорожній таблиці, або
 * блокує запис під час rolling deploy — поле спершу nullable, backfill, потім
 * `SET NOT NULL` окремою міграцією.
 */
const unsafeAddColumn = (sql) =>
  /\bADD\s+COLUMN\b/i.test(sql) && /\bNOT\s+NULL\b/i.test(sql) && !/\bDEFAULT\b/i.test(sql);

/** Перевіряє один migration.sql; повертає список порушень. */
export function checkMigrationSql(text, file = 'migration.sql', migrationName = '') {
  const problems = [];
  const allow = (ruleId) => ALLOWLIST.has(`${migrationName}:${ruleId}`);

  for (const { sql, line } of splitStatements(text)) {
    for (const rule of RULES) {
      if (rule.re.test(sql) && !allow(rule.id)) {
        problems.push(
          `${file}:${line}: ${rule.what} у міграції — ламає старий інстанс під час rolling deploy; ` +
            'expand/contract окремими кроками (engineering-principles.md §Міграції)'
        );
      }
    }
    if (unsafeAddColumn(sql) && !allow('add-not-null-without-default')) {
      problems.push(
        `${file}:${line}: ADD COLUMN ... NOT NULL без DEFAULT — спершу nullable-колонка і backfill, ` +
          'потім SET NOT NULL окремою міграцією'
      );
    }
  }
  return problems;
}

/** Сканує каталог міграцій; повертає список порушень з відносними шляхами. */
export function scanMigrations(root) {
  const dir = path.join(root, MIGRATIONS_DIR);
  if (!fs.existsSync(dir)) return [];
  const problems = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const file = path.join(dir, name, 'migration.sql');
    if (!fs.existsSync(file)) continue;
    const rel = path.relative(root, file).split(path.sep).join('/');
    problems.push(...checkMigrationSql(fs.readFileSync(file, 'utf8'), rel, name));
  }
  return problems;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const problems = scanMigrations(root);
  if (problems.length > 0) {
    console.error(`Гейт безпеки міграцій (T-4812): ${problems.length} порушень\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error('\nДеталі — docs/engineering-principles.md §Міграції без downtime.');
    process.exit(1);
  }
  console.log('Гейт безпеки міграцій (T-4812): чисто — SQL міграцій сумісний із rolling deploy.');
}
