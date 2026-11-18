#!/usr/bin/env node
// Зведення індексу беклогу (backlog/index) тими самими правилами, що й docs:validate.

import { parseBacklogIndex } from './validate-docs/backlog-index.mjs';
import { computeStoryPoints } from './validate-docs/backlog-sp.mjs';
import { errors } from './validate-docs/context.mjs';

const { rows, taskFiles } = parseBacklogIndex();
const { top, spByMilestone, totalSp } = computeStoryPoints(rows, taskFiles);

const order = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M7', 'M10', 'Горизонтальні'];
const seen = new Set(order);
for (const name of spByMilestone.keys()) if (name && !seen.has(name)) order.push(name);

console.log('Мілістони:');
for (const name of order) {
  const sectionRows = rows.filter((r) => r.milestone === name);
  if (!sectionRows.length && !spByMilestone.has(name)) continue;
  const topCount = sectionRows.filter((r) => !r.slice).length;
  const statusRows = {};
  for (const r of sectionRows) statusRows[r.status] = (statusRows[r.status] || 0) + 1;
  console.log(
    `  ${name}: ${topCount}/${sectionRows.length} задач, ${spByMilestone.get(name) ?? 0} SP, todo=${statusRows.todo || 0}, in_progress=${statusRows.in_progress || 0}, review=${statusRows.review || 0}, done=${statusRows.done || 0}, split=${statusRows.split || 0}`
  );
}

const allStatuses = {};
for (const r of rows) allStatuses[r.status] = (allStatuses[r.status] || 0) + 1;
const spFmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
console.log(
  `\nРазом: ${rows.length} задач в індексі, ${top.length} топ-рівневі задачі + ${rows.length - top.length} слайсів, **${spFmt(totalSp)} SP** загалом`
);
console.log(
  `Статуси: ${allStatuses.todo || 0} \`todo\`, ${allStatuses.in_progress || 0} \`in_progress\`, ${allStatuses.review || 0} \`review\`, ${allStatuses.done || 0} \`done\`, ${allStatuses.split || 0} \`split\``
);

if (errors.length) {
  console.error(`\n✖ ${errors.length} помилок індексу:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
