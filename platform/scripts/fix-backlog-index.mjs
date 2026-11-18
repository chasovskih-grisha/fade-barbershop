#!/usr/bin/env node
// Генерує пропущені рядки індексу беклогу і вставляє їх у backlog/index/.
// Запуск: node scripts/fix-backlog-index.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const indexDir = join(root, 'backlog/index');
const tasksDir = join(root, 'backlog/tasks');

const indexFiles = readdirSync(indexDir)
  .filter((f) => f.endsWith('.md'))
  .sort();
const fileLines = new Map(
  indexFiles.map((name) => [name, readFileSync(join(indexDir, name), 'utf8').split('\n')])
);

const taskFiles = readdirSync(tasksDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.slice(0, -3));

const inIndex = new Set();
for (const lines of fileLines.values()) {
  for (const line of lines) {
    const m = line.match(/^\|\s*\[(T-[0-9A-Za-z-]+)\]\((?:\.\.\/)?tasks\/(T-[^)]+)\.md\)/);
    if (m) inIndex.add(m[2]);
  }
}

const missing = taskFiles.filter((f) => !inIndex.has(f));
const generated = [];

for (const slug of missing.sort()) {
  const content = readFileSync(join(tasksDir, slug + '.md'), 'utf8');

  const titleM = content.match(/^# T-[0-9A-Za-z-]+ · (.+)/m);
  const title = titleM ? titleM[1].trim() : slug;

  const tagsM = content.match(/\*\*Теги\*\*:\s*([^\n]+)/m);
  let tags = tagsM ? tagsM[1].trim() : '—';
  if (tags.includes('·')) tags = tags.split('·')[0].trim();
  if (!tags) tags = '—';

  const diffM = content.match(/\*\*Складність\*\*:\s*(\S+)/m);
  const difficulty = diffM ? diffM[1].trim() : 'junior';

  let milestone;
  if (slug.startsWith('T-6009')) milestone = 'M0';
  else if (slug.startsWith('T-05')) milestone = 'M1';
  else if (slug.startsWith('T-270')) milestone = 'M5';
  else if (slug.startsWith('T-460') || slug.startsWith('T-461')) milestone = 'M1';
  else if (slug.startsWith('T-60') || slug.startsWith('T-50')) milestone = 'M10';
  else continue;

  const row = `| [${slug}](../tasks/${slug}.md) | ${title} | — | ${tags} | ${difficulty} | todo |`;
  generated.push({ slug, milestone, row });
}

const dirty = new Set();
for (const [milestone, items] of Object.entries(
  generated.reduce((acc, gr) => {
    acc[gr.milestone] = acc[gr.milestone] || [];
    acc[gr.milestone].push(gr);
    return acc;
  }, {})
)) {
  const heading = new RegExp(`^### ${milestone} `);
  const name = [...fileLines.keys()].find((file) =>
    fileLines.get(file).some((line) => heading.test(line))
  );
  if (!name) {
    console.error(`⚠️ Мілістон ${milestone} не знайдено`);
    continue;
  }
  const lines = fileLines.get(name);
  let insertIdx = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('|')) {
      insertIdx = i + 1;
      break;
    }
  }
  const sorted = items.sort((a, b) => a.slug.localeCompare(b.slug));
  lines.splice(insertIdx, 0, ...sorted.map((item) => item.row));
  dirty.add(name);
}

for (const name of dirty) {
  writeFileSync(join(indexDir, name), fileLines.get(name).join('\n'), 'utf8');
}

console.log(`✅ Додано ${generated.length} рядків:`);
for (const gr of generated) console.log(`  ${gr.milestone}: ${gr.slug}`);
