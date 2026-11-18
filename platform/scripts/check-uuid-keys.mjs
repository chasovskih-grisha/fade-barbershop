#!/usr/bin/env node
// T-4300f · CI-гейт «UUID only» (ADR 0021).
//
// Політика без гейта живе один спринт, тому дві перевірки виконуються в CI
// незалежно від ESLint (у ESLint ті самі правила живуть як eslint-plugin-uuid-keys
// — для зворотного зв'язку в редакторі):
//
//   1) Prisma: доменна модель не може мати Int/BigInt PK, `autoincrement()` або
//      DB-дефолт (`uuid()`/`dbgenerated()`): id генерує код агрегатів через
//      `uuidv7()`. Дозволено — `String @id @db.Uuid`; інфраструктурні таблиці з
//      натуральним ключем — у PRISMA_PK_ALLOWLIST (ADR 0021, Exclusions).
//   2) Код: не можна генерувати доменні id через `randomUUID()`/`.v4()` (лише
//      `uuidv7()` зі shared kernel) і не можна хардкодити читабельний id
//      (`id: 'loc-1'`, `locationId: 'loc_KYY_01'`) — такий рядок не пройде в
//      uuid-колонку (T-4300b).
//
// Запуск: `pnpm uuid:check` (з platform/). Тести: `pnpm uuid:test`.
// Вивід: `path:line: message`, exit 1 на будь-яке порушення.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** UUID будь-якої версії 1–8 з variant RFC 9562 — те саме, що приймають контракти. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Читабельний id: слаг із розділювачем — `loc-1`, `loc_KYY_01`, `comp-2`. */
const READABLE_ID_RE = /^[a-z][a-z0-9]*(?:[-_][A-Za-z0-9]+)+$/;

/** Ключ, що тримає ідентифікатор: id, userId, aggregateId, client_id. */
const ID_KEY_RE = /^(?:id|[a-z][a-z0-9]*(?:_?Id|_id))$/;

/**
 * Prisma-моделі, яким ADR 0021 дозволяє не-UUID PK (секція Exclusions:
 * «pure infrastructure tables»). Кожен запис — з причиною, не «бо падає».
 */
export const PRISMA_PK_ALLOWLIST = new Map([
  [
    'AppSetting',
    'key→JSON налаштування платформи: натуральний ключ, не доменна сутність (ADR 0021, Exclusions)',
  ],
]);

/**
 * Файли, де `randomUUID()` не генерує доменний id: трасування запитів, ключі
 * об'єктів у сховищі, handle зовнішніх job. Гейт стосується ідентичності
 * доменних об'єктів, а не будь-якого випадкового рядка.
 */
export const GENERATOR_ALLOWLIST = new Set([
  'shared/logging/request-telemetry.interceptor.ts',
  'haircut-ai/infrastructure/fake-ai-generation.gateway.ts',
  'haircut-ai/infrastructure/gemini-ai-generation.gateway.ts',
  'haircut-ai/infrastructure/s3-photo-storage.ts',
]);

/**
 * Читабельні id, дозволені свідомо: Swagger-приклад і плейсхолдер-власник у
 * fake/gemini-провайдерах (демо-запис, не доменна сутність).
 */
export const READABLE_ID_ALLOWLIST = new Set(['booking-123', 'ai-fake', 'ai-gemini']);

/**
 * Файл поза гейтом: статичний демо-каталог донатів, де id — це слаги послуг
 * для прикладу, а не ідентичність у БД (та сама мапа є в ESLint-винятках).
 */
export const CODE_SKIP_PATHS = new Set(['src/catalog/domain/revenue-optimization.ts']);

const PRISMA_INT_PK = /^(?:Int|BigInt)$/;

const toPosix = (p) => p.replace(/\\/g, '/');

/** Тестові двійники, сіди й фіксчери тримають читабельні ключі свідомо. */
export function isTestOrSeedPath(relPath) {
  const p = toPosix(relPath);
  return (
    /\.spec\.ts$/.test(p) ||
    /\.e2e\.ts$/.test(p) ||
    /\/e2e\//.test(p) ||
    /\.fakes\.ts$/.test(p) ||
    /\.fixtures?\.ts$/.test(p) ||
    /\.env\.ts$/.test(p) ||
    /[-.]setup\.ts$/.test(p) ||
    /test-fixtures?\.ts$/.test(p) ||
    /(^|\/)seed[-.]/.test(p) ||
    /(^|\/)seed\//.test(p)
  );
}

/** Чи цей файл генерує доменні id (domain/application або IdGenerator-адаптер). */
export function isIdGenerationPath(relPath) {
  const p = toPosix(relPath);
  return /\/(?:domain|application)\//.test(p) || /uuid-id-generator\.ts$/.test(p);
}

/** Перевіряє один *.prisma файл; повертає список порушень. */
export function checkPrismaSource(text, file = 'schema.prisma') {
  const problems = [];
  const modelRe = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let match;

  while ((match = modelRe.exec(text)) !== null) {
    const model = match[1];
    if (PRISMA_PK_ALLOWLIST.has(model)) continue;
    const modelLine = text.slice(0, match.index).split('\n').length;
    const body = match[2].split('\n');

    body.forEach((line, index) => {
      const lineNo = modelLine + index;
      const trimmed = line.trim();
      if (trimmed.startsWith('@@id')) {
        problems.push(
          `${file}:${lineNo}: ${model}: складений @@id — доменна модель мусить мати один UUID PK (ADR 0021)`
        );
        return;
      }
      const field = line.match(/^\s*(\w+)\s+(\w+)(?:\[\])?\??\s+(.*)$/);
      if (!field || !/@id\b/.test(field[3])) return;

      const [, name, type, rest] = field;
      if (PRISMA_INT_PK.test(type)) {
        problems.push(
          `${file}:${lineNo}: ${model}.${name}: Int/BigInt PK заборонено — String @id @db.Uuid (ADR 0021)`
        );
      } else if (/@default\(\s*autoincrement\(\)\s*\)/.test(rest)) {
        problems.push(
          `${file}:${lineNo}: ${model}.${name}: autoincrement() заборонено — id генерує uuidv7() у коді`
        );
      } else if (/@default\(\s*(?:uuid|dbgenerated)\s*\(/.test(rest)) {
        problems.push(
          `${file}:${lineNo}: ${model}.${name}: DB-дефолт id заборонено — генерація client-side через uuidv7() (ADR 0021)`
        );
      } else if (!/@db\.Uuid\b/.test(rest)) {
        problems.push(
          `${file}:${lineNo}: ${model}.${name}: PK без @db.Uuid — доменні ключі лише uuid (ADR 0021); ` +
            'інфраструктурну таблицю додайте в PRISMA_PK_ALLOWLIST з причиною'
        );
      }
    });
  }
  return problems;
}

/** Перевіряє один .ts файл API; повертає список порушень. */
export function checkCodeSource(text, relPath = 'src/example.ts') {
  const relative = toPosix(relPath);
  if (isTestOrSeedPath(relative) || CODE_SKIP_PATHS.has(relative)) return [];
  const problems = [];
  const generatesId = isIdGenerationPath(relative);

  text.split('\n').forEach((line, index) => {
    const lineNo = index + 1;

    const idMatch = line.match(/\b(\w+)\s*:\s*'([^']*)'/);
    if (idMatch) {
      const [, key, value] = idMatch;
      if (
        ID_KEY_RE.test(key) &&
        !UUID_RE.test(value) &&
        READABLE_ID_RE.test(value) &&
        !READABLE_ID_ALLOWLIST.has(value)
      ) {
        problems.push(
          `${relative}:${lineNo}: читабельний id "${value}" у полі ${key} — доменні id лише UUID (ADR 0021)`
        );
      }
    }

    const usesV4 =
      /\brandomUUID\s*\(/.test(line) || /\buuid\.v4\s*\(/.test(line) || /\bv4\s*\(/.test(line);
    if (generatesId && usesV4 && !GENERATOR_ALLOWLIST.has(relative)) {
      problems.push(
        `${relative}:${lineNo}: randomUUID()/v4() для доменного id — лише uuidv7() зі @fade/domain-shared (ADR 0021)`
      );
    }
  });
  return problems;
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.'))
      continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Сканує проєкт: усі *.prisma + код apps/api/src. */
export function scanProject(root) {
  const problems = [];

  const prismaFiles = ['apps', 'packages']
    .flatMap((dir) => walk(path.join(root, dir), []))
    .filter((f) => f.endsWith('.prisma'));
  for (const file of prismaFiles) {
    problems.push(...checkPrismaSource(fs.readFileSync(file, 'utf8'), path.relative(root, file)));
  }

  const apiRoot = path.join(root, 'apps/api');
  const codeFiles = walk(path.join(apiRoot, 'src'), []).filter((f) => f.endsWith('.ts'));
  for (const file of codeFiles) {
    problems.push(...checkCodeSource(fs.readFileSync(file, 'utf8'), path.relative(apiRoot, file)));
  }

  return problems;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const problems = scanProject(root);
  if (problems.length > 0) {
    console.error(`UUID-гейт (ADR 0021): ${problems.length} порушень\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error('\nДеталі — docs/engineering-principles.md §UUID Keys.');
    process.exit(1);
  }
  console.log('UUID-гейт (ADR 0021): чисто — Prisma PK і генерація id відповідають політиці.');
}
