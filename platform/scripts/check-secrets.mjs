#!/usr/bin/env node
// T-4807 · CI-гейт секретів у репозиторії (security-hardening.md).
//
// Секрет, що потрапив у git, лишається в історії назавжди: ротація — єдиний
// спосіб відкликати, але до неї ключ уже втрачено. Гейт сканує відстежувані
// файли на високоточні зразки ключів (приватні ключі, AWS/GCP/Slack/GitHub/
// Stripe токени) і червонить, доки значення не прибрано з дерева.
//
// Запуск: `pnpm secrets:check` (з platform/). Тести: `pnpm secrets:test`.
// Вивід: `path:line: message`, exit 1 на будь-яке порушення. Хибне спрацювання
// глушиться рядком у ALLOWLIST з причиною, а не вимкненням перевірки.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Високоточні зразки: збіг майже напевно справжній секрет, не слово в тексті. */
export const SECRET_PATTERNS = [
  { id: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, what: 'приватний ключ (PEM)' },
  { id: 'aws-access-key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, what: 'AWS access key id' },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/, what: 'Google API key' },
  { id: 'slack-token', re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/, what: 'Slack token' },
  { id: 'github-token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/, what: 'GitHub token' },
  { id: 'stripe-secret', re: /\bsk_live_[0-9A-Za-z]{24,}\b/, what: 'Stripe live secret key' },
];

/**
 * Шляхи поза гейтом: приклади конфігів із плейсхолдерами (`your-secret-token-here`),
 * документація і цей самий гейт (його зразки — навчальні, не справжні ключі).
 */
export const SKIP_PATHS = new Set([
  'scripts/check-secrets.mjs',
  'scripts/check-secrets.test.mjs',
  '.env.example',
  'infra/.env.docker.example',
]);

/** Службові файли: бінарні/генеровані, у них секрет не живе (і скан дорогий). */
const SKIP_RE = /(^|\/)(node_modules|\.git|dist|\.next|\.expo|coverage|vendor)\//;

/** Лок-файли менеджерів пакетів: генеровані, без секретів, великі. */
const LOCKFILE_RE = /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/;

/** Чи цей шлях сканується (не службовий, не в allowlist). */
export function isScannable(relPath) {
  const p = relPath.split(path.sep).join('/');
  if (SKIP_PATHS.has(p)) return false;
  if (SKIP_RE.test(p)) return false;
  if (LOCKFILE_RE.test(p)) return false;
  return !/\.(?:png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|lock|snap)$/i.test(p);
}

/** Перевіряє один текст; повертає список порушень із номером рядка. */
export function checkSecretSource(text, relPath = 'example.ts') {
  const problems = [];
  text.split('\n').forEach((line, index) => {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.re.test(line)) {
        problems.push(
          `${relPath}:${index + 1}: знайдено ${pattern.what} — приберіть з дерева і ротуйте`
        );
      }
    }
  });
  return problems;
}

/** Сканує відстежувані git-файли репозиторію; повертає список порушень. */
export function scanRepository(root) {
  let files;
  try {
    files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
      .split('\0')
      .filter(Boolean);
  } catch {
    return [];
  }
  const problems = [];
  for (const rel of files) {
    if (!isScannable(rel)) continue;
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    problems.push(...checkSecretSource(fs.readFileSync(abs, 'utf8'), rel));
  }
  return problems;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const problems = scanRepository(root);
  if (problems.length > 0) {
    console.error(`Гейт секретів (T-4807): ${problems.length} порушень\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error('\nДеталі — docs/security-hardening.md §2 Secrets and configuration.');
    process.exit(1);
  }
  console.log(
    'Гейт секретів (T-4807): чисто — у відстежуваних файлах немає відомих зразків ключів.'
  );
}
