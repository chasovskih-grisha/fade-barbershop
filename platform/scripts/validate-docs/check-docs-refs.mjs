// Перевірка 2: згадки `docs/<name>.md` резолвляться у теку docs/.
// Виняток — анотовані згадки (рядок пояснює, що файл-фантом ніколи не існував):
// це документація відсутності.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, read, fail } from './context.mjs';

const ANNOTATED =
  /фантом|неіснуюч|несуществн|не існує|ніколи не існував|не створен|phantom|never existed/;

export const checkDocsRefs = (mdFiles) => {
  const docsDirListing = readdirSync(join(root, 'docs'));
  for (const rel of mdFiles) {
    for (const line of read(rel).split('\n')) {
      for (const m of line.matchAll(/docs\/([a-z0-9-]+\.md)/g)) {
        if (ANNOTATED.test(line)) continue;
        if (!docsDirListing.includes(m[1])) fail(`${rel}: згадка «docs/${m[1]}» — файлу не існує`);
      }
    }
  }
};
