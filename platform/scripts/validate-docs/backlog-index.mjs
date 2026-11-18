// Беклог, частина 1: парсинг індексу backlog/index (один файл на етап,
// 6 клітинок у рядку, статус із визначеного набору) і перехресна звірка
// з файлами backlog/tasks/.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, read, fail } from './context.mjs';

const TASK_STATUSES = new Set(['todo', 'in_progress', 'review', 'done', 'split']);
const ROW_RE = /^\|\s*\[(T-[0-9A-Za-z-]+)\]\((?:\.\.\/)?tasks\/(T-[^)]+)\.md\)\s*\|(.*)\|$/;
const MILESTONE_RE = /^### (M\d+|Горизонтальні)\b/;
const splitCells = (text) => text.split(/(?<!\\)\|/).map((c) => c.trim());

export const listTaskFiles = () =>
  readdirSync(join(root, 'backlog/tasks'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3));

export const listIndexFiles = () =>
  readdirSync(join(root, 'backlog/index'))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => `backlog/index/${f}`);

const buildRow = (m, rest, milestone, rel) => {
  const [, id, slug] = m;
  const cells = splitCells(rest);
  if (cells.length !== 5)
    fail(`${rel}: ${id} — ${cells.length + 1} клітинок замість 6 (неекранований «|» у полі)`);
  const status = cells.at(-1).split(' ')[0];
  if (!TASK_STATUSES.has(status)) fail(`${rel}: ${id} — невідомий статус «${cells.at(-1)}»`);
  return { id, slug, milestone, cells, status, slice: cells[0].startsWith('└') };
};

export const parseBacklogIndex = () => {
  const taskFiles = listTaskFiles();
  const rows = [];
  for (const rel of listIndexFiles()) {
    let milestone = null;
    for (const line of read(rel).split('\n')) {
      const head = line.match(MILESTONE_RE);
      if (head) milestone = head[1];
      const m = line.match(ROW_RE);
      if (!m) continue;
      rows.push(buildRow(m, m[3], milestone, rel));
    }
  }

  const seen = new Map();
  for (const { id, slug } of rows) {
    if (seen.has(slug))
      fail(`backlog/index: дубль індексу — ${slug} (рядки ${seen.get(slug)}, ${id})`);
    seen.set(slug, id);
    if (!taskFiles.includes(slug))
      fail(`backlog/index: рядок ${slug} — немає файлу в backlog/tasks/`);
  }
  for (const file of taskFiles) {
    if (!seen.has(file)) fail(`backlog/tasks/${file}.md: файл без рядка в індексі`);
  }
  return { rows, taskFiles };
};
