#!/usr/bin/env node
// T-4807 · Вмикає git-хуки репозиторію (зараз — pre-commit гейт секретів).
// Запуск: `pnpm hooks:install`. `core.hooksPath` вказує на `hooks/`, тож
// версійовані хуки діють без сторонніх залежностей (husky тощо).

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  execFileSync('git', ['config', 'core.hooksPath', 'hooks'], { cwd: root, stdio: 'inherit' });
  console.log('Git hooks installed: core.hooksPath=hooks (pre-commit → pnpm secrets:check).');
} catch {
  console.error('Не вдалося встановити git-хуки (git недоступний?).');
  process.exit(1);
}
