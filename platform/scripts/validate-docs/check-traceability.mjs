// Перевірка 3: traceability.md — 6 клітинок у рядку, статуси рядків узгоджені
// з [x]-відмітками файлів AC, межі діапазонів ID існують у файлі AC.

import { read, fail } from './context.mjs';

const AC_DIR = 'docs/acceptance-criteria';
const STATUSES = ['—', 'у роботі', 'прийнято', 'підтверджено'];

const parseRow = (line, i) => {
  if (!/[A-Z]{2,}-[A-Z]*\d/.test(line)) return null;
  const cells = line.split('|').map((c) => c.trim());
  if (cells.length !== 7)
    fail(`${AC_DIR}/traceability.md:${i + 1}: ${cells.length - 2} клітинок замість 6`);
  const status = cells[4] ?? '';
  if (!STATUSES.includes(status))
    fail(`${AC_DIR}/traceability.md:${i + 1}: некоректний статус «${status}»`);
  return { line: i + 1, status, cell: cells[1] };
};

const parseSections = (tr) => {
  let section = null;
  const sections = new Map(); // acFile -> { rows: [{ line, status, cell }] }
  for (const [i, line] of tr.entries()) {
    const h = line.match(/^## \d{2} — .*\(`?(\d{2}-[a-z-]+\.md)`?\)/);
    if (h) {
      section = h[1];
      sections.set(section, { rows: [] });
      continue;
    }
    if (!section || !line.startsWith('| ')) continue;
    const row = parseRow(line, i);
    if (row) sections.get(section).rows.push(row);
  }
  return sections;
};

const failIfAcceptedEarly = (r, ctx) => {
  if (r.status !== 'прийнято' || ctx.group === 'прийнято') return;
  const ids = (r.cell.match(/(?<![A-Z0-9…])[A-Z]{2,}(?:-[A-Z]+)*-\d+/g) ?? []).filter(
    (t) => !t.includes('…')
  );
  const shown = ids.join(', ') || r.cell;
  // Індивідуально прийняті критерії: рядок може бути «прийнято» до групи
  // (правило файлу), якщо кожен критерій рядка відмічений [x] у файлі AC.
  if (ids.length === 0 || !ids.every((id) => ctx.tickedIds.has(id)))
    fail(
      `traceability (${ctx.acFile}, рядок ${r.line}): «прийнято», але критерії ${shown} не відмічені [x] у файлі AC`
    );
};

const checkRowStatus = (r, ctx) => {
  failIfAcceptedEarly(r, ctx);
  if (r.status === 'у роботі' && ctx.group === '—')
    fail(
      `traceability (${ctx.acFile}, рядок ${r.line}): «у роботі», але у групі немає жодного [x]`
    );
  if (r.status === '—' && ctx.group === 'прийнято')
    fail(`traceability (${ctx.acFile}, рядок ${r.line}): «—», але всі критерії групи [x]`);
};

const checkRangeBounds = (rows, ac, acFile) => {
  for (const r of rows) {
    for (const t of r.cell.match(/[A-Z]{2,}(?:-[A-Z]+)*-\d+(?:…\d+)?/g) ?? []) {
      const range = t.match(/^([A-Z]+(?:-[A-Z]+)*)-(\d+)…(\d+)$/);
      const topId = range ? `${range[1]}-${String(range[3]).padStart(range[2].length, '0')}` : t;
      if (!ac.includes(topId))
        fail(
          `traceability (${acFile}, рядок ${r.line}): межа діапазону «${topId}» відсутня у файлі AC`
        );
    }
  }
};

export const checkTraceability = () => {
  const sections = parseSections(read(`${AC_DIR}/traceability.md`).split('\n'));
  for (const [acFile, { rows }] of sections) {
    const ac = read(`${AC_DIR}/${acFile}`);
    const x = (ac.match(/\[x\]/g) ?? []).length;
    const open = (ac.match(/\[ \]/g) ?? []).length;
    const group = x === 0 ? '—' : open === 0 ? 'прийнято' : 'у роботі';
    const tickedIds = new Set(
      [...ac.matchAll(/^- \[x\] \*\*([A-Z]+(?:-[A-Z]+)*-\d+)\.\*\*/gm)].map((m) => m[1])
    );
    const ctx = { group, tickedIds, acFile };
    for (const r of rows) checkRowStatus(r, ctx);
    checkRangeBounds(rows, ac, acFile);
  }
  return sections.size;
};
