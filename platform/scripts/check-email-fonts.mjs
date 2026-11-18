#!/usr/bin/env node
// T-4611a · Гейт «email = системний стек, не Fixel» (design-system.md §Типографіка).
//
// Правило зафіксоване, бо воно не очевидне: дизайн-система вимагає Fixel
// Display/Text, але в листах webfont не працює — Gmail вирізає <style> і
// зовнішні шрифти, Outlook не підтримує @font-face. Тому листи використовують
// системний стек із токена `email.fontStack`, а не рядок у шаблоні.
//
// Без гейта перший же новий лист скопіює `font-family:Fixel …` зі сторінки —
// і вигляд зламається лише в клієнта, де це ніхто не побачить у ревʼю.
//
// Запуск: `pnpm email:check` (з platform/). Тести: `pnpm email:test`.
// Вивід: `path:line: message`, exit 1 на будь-яке порушення.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Тека з листами: шаблони й примітиви notifications. */
export const EMAIL_DIR = 'apps/api/src/notifications';

/** Заборонені в листах сімейства (Fixel — webfont, у email не працює). */
const FORBIDDEN = [/Fixel\s+Display/i, /Fixel\s+Text/i];

/** Рядок вважається порушенням, якщо містить заборонене сімейство у font-family. */
export function checkEmailFontsSource(text) {
  const violations = [];
  text.split('\n').forEach((line, i) => {
    if (!/font-family/i.test(line)) return;
    if (FORBIDDEN.some((re) => re.test(line))) {
      violations.push({
        line: i + 1,
        message: 'Fixel у листі — webfont не працює в Gmail/Outlook; лише email.fontStack',
      });
    }
  });
  return violations;
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (/\.(ts|liquid)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

export function scanProject(rootDir) {
  const files = listFiles(path.join(rootDir, EMAIL_DIR));
  const violations = [];
  for (const file of files) {
    for (const v of checkEmailFontsSource(fs.readFileSync(file, 'utf8'))) {
      violations.push({ file: path.relative(rootDir, file), ...v });
    }
  }
  return violations;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const violations = scanProject(root);
  for (const v of violations) console.error(`${v.file}:${v.line}: ${v.message}`);
  if (violations.length > 0) {
    console.error(
      `email-fonts: ${violations.length} порушень — листи мусять використовувати email.fontStack.`
    );
    process.exit(1);
  }
  console.log('email-fonts: Fixel не просочився в листи');
}
