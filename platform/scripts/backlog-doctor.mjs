#!/usr/bin/env node
// T-4619d: цілісність беклогу — індекс, файли, статуси й задачі, що
// перетинають місця (backend+frontend тощо). Structural errors fail the run;
// cross-seat findings are warnings so the backlog can be triaged, not blocked.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const STATUSES = new Set(['todo', 'in_progress', 'review', 'qa', 'done', 'split']);
const CRAFT = new Set(['backend', 'frontend', 'mobile', 'design', 'seo', 'devops']);
const ROW_RE = /^\|\s*\[(T-[0-9A-Za-z-]+)\]\([^)]*tasks\/(T-[^)]+)\.md\)\s*\|(.*)\|$/;

export function parseRows(text, file = 'index') {
  let milestone = null;
  const rows = [];
  for (const line of text.split('\n')) {
    const head = line.match(/^### (M\d+|Горизонтальні)\b/);
    if (head) milestone = head[1];
    const match = line.match(ROW_RE);
    if (!match) continue;
    const cells = match[3].split(/(?<!\\)\|/).map((cell) => cell.trim());
    if (cells.length !== 5) continue;
    rows.push({
      id: match[1],
      slug: match[2],
      milestone,
      tags: cells[2].split(',').map((tag) => tag.trim()).filter(Boolean),
      status: cells[4].split(' ')[0],
      file,
    });
  }
  return rows;
}

export function tagsFromTask(text) {
  const line = text.split('\n').find((entry) => /\*\*Tags\*\*/.test(entry));
  return line
    ? line.split(':').slice(1).join(':').split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];
}

export function diagnose({ rows, taskFiles, taskText = () => '' }) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map();
  const seenSlugs = new Map();
  for (const row of rows) {
    if (seenIds.has(row.id)) errors.push(`duplicate id ${row.id} (${row.file})`);
    seenIds.set(row.id, row);
    if (seenSlugs.has(row.slug)) errors.push(`duplicate task ${row.slug} in index`);
    seenSlugs.set(row.slug, row);
    if (!STATUSES.has(row.status)) errors.push(`${row.id}: unknown status "${row.status}"`);
    if (!taskFiles.includes(row.slug)) errors.push(`${row.id}: no backlog/tasks/${row.slug}.md`);
  }
  for (const file of taskFiles) {
    if (!seenSlugs.has(file)) errors.push(`backlog/tasks/${file}.md has no index row`);
  }
  for (const row of rows) {
    const doneBody = (taskText(row.slug) ?? '').split(/^## Done\s*$/m)[1]?.split(/^## /m)[0] ?? '';
    const doneItems = [...doneBody.matchAll(/^- \[( |x)\]/gm)].map((match) => match[1]);
    if (row.status === 'done' && doneItems.some((mark) => mark === ' ')) {
      warnings.push(`${row.id} done but its Done items are unchecked`);
    }
    if ((row.status === 'todo' || row.status === 'split') && doneItems.length > 0 && doneItems.every((mark) => mark === 'x')) {
      warnings.push(`${row.id} ${row.status} but every Done item is checked`);
    }
    if (row.status === 'done' || row.status === 'split') continue;
    const tags = [...new Set([...row.tags, ...tagsFromTask(taskText(row.slug))])];
    const crafts = tags.filter((tag) => CRAFT.has(tag));
    if (crafts.length > 1) {
      warnings.push(`${row.id} ${row.status}: cross-seat (${crafts.join(', ')}) — split it`);
    }
  }
  const byStatus = {};
  for (const row of rows) byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  return { errors, warnings, stats: { rows: rows.length, files: taskFiles.length, byStatus } };
}

export function readRepository(root = process.cwd()) {
  const indexDir = join(root, 'backlog/index');
  const tasksDir = join(root, 'backlog/tasks');
  const rows = readdirSync(indexDir)
    .filter((file) => file.endsWith('.md'))
    .flatMap((file) => parseRows(readFileSync(join(indexDir, file), 'utf8'), `backlog/index/${file}`));
  const taskFiles = readdirSync(tasksDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.slice(0, -3));
  const text = new Map(
    taskFiles.map((file) => [file, readFileSync(join(tasksDir, `${file}.md`), 'utf8')])
  );
  return { rows, taskFiles, taskText: (slug) => text.get(slug) ?? '' };
}

if (process.argv[1]?.endsWith('backlog-doctor.mjs')) {
  const strict = process.argv.includes('--strict');
  const result = diagnose(readRepository());
  const { stats } = result;
  console.log(
    `backlog: ${stats.rows} rows / ${stats.files} tasks — ` +
      Object.entries(stats.byStatus)
        .map(([status, count]) => `${status}=${count}`)
        .join(', ')
  );
  for (const warning of result.warnings.slice(0, 20)) console.warn(`⚠ ${warning}`);
  if (result.warnings.length > 20) console.warn(`… ${result.warnings.length - 20} more warnings`);
  for (const error of result.errors) console.error(`✖ ${error}`);
  if (result.errors.length || (strict && result.warnings.length)) process.exit(1);
  console.log('✓ backlog integrity ok');
}
