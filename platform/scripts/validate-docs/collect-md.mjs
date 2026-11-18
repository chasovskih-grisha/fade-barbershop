// Collection of md-files for verification: recursive traversal of documentation and code directories
// without node_modules, _archive and ADR directory itself.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './context.mjs';

const SCANNED_DIRS = ['backlog', 'docs', 'apps', 'packages', 'mcp'];
const SKIPPED_DIRS = ['node_modules', '_archive'];

export const collectMdFiles = () => {
  const mdFiles = [];
  const walk = (dir) => {
    for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (SKIPPED_DIRS.includes(e.name)) continue;
      const rel = join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (e.name.endsWith('.md') && !rel.startsWith('docs/adr')) mdFiles.push(rel);
    }
  };
  for (const d of SCANNED_DIRS) walk(d);
  return mdFiles;
};
