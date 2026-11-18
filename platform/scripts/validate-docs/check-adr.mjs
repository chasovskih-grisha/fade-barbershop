// Перевірка 1: цитати «ADR NNNN» резолвляться у docs/adr/. Діапазони
// «ADR 0022–0047» — історичні згадки, не цитати (негативний погляд вперед).

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, read, fail } from './context.mjs';

export const checkAdrCitations = (mdFiles) => {
  const adrNumbers = new Set(
    readdirSync(join(root, 'docs/adr'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.match(/^(\d{4})-/)?.[1])
  );
  for (const rel of mdFiles) {
    for (const m of read(rel).matchAll(/ADR (\d{4})(?!–\d)/g)) {
      if (!adrNumbers.has(m[1])) fail(`${rel}: цитата «ADR ${m[1]}» не резолвиться у docs/adr/`);
    }
  }
};
