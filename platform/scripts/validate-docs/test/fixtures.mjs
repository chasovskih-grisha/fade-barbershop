// Тестова інфраструктура: тимчасове дерево файлів як корінь валідатора
// з гарантованим прибиранням і скиданням контексту.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { useTestRoot, resetContext, errors } from '../context.mjs';

/** Запускає run() у тимчасовому корені з деревом tree: { 'шлях/файл.md': 'вміст' }. */
export const withFixture = (tree, run) => {
  const dir = mkdtempSync(join(tmpdir(), 'docsval-'));
  for (const [rel, content] of Object.entries(tree)) {
    const path = join(dir, rel);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, content);
  }
  useTestRoot(dir);
  try {
    return run();
  } finally {
    resetContext();
    rmSync(dir, { recursive: true, force: true });
  }
};

export const messages = () => [...errors];
