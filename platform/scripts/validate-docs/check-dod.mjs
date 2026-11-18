// Перевірка 4: DoD ↔ roadmap — ті самі секції в тому самому порядку
// з однаковою кількістю пунктів (рядків таблиці DoD / пунктів чеклиста).

import { read, fail } from './context.mjs';

const checklistOf = (text, { start, header, stop, item }) => {
  const out = [];
  let cur = null;
  let started = false;
  for (const line of text.split('\n')) {
    if (!started) {
      if (start.test(line)) started = true;
      continue;
    }
    if (stop.test(line)) break;
    const h = line.match(header);
    if (h) cur = { name: h[1].trim(), items: 0 };
    else if (cur && item.test(line)) cur.items += 1;
    if (cur && !out.includes(cur)) out.push(cur);
  }
  return out.filter((s) => s.items > 0);
};

export const checkDodRoadmap = () => {
  const roadmap = checklistOf(read('docs/roadmap.md'), {
    start: /^## Чеклист запуску v1/,
    header: /^### (.+)$/,
    stop: /^## Поза scope/,
    item: /^- \[/,
  });
  const dod = checklistOf(read('backlog/definition-of-done.md'), {
    start: /^# Definition of Done/,
    header: /^## (.+)$/,
    stop: /^## Звідки брати/,
    item: /^\| \d+\.\d+ \|/,
  });
  if (roadmap.length !== dod.length)
    fail(`DoD: ${dod.length} секцій проти ${roadmap.length} у чеклисті roadmap`);
  for (let i = 0; i < Math.min(roadmap.length, dod.length); i++) {
    if (roadmap[i].name !== dod[i].name)
      fail(`DoD: секція «${dod[i].name}» ≠ «${roadmap[i].name}» (roadmap)`);
    if (roadmap[i].items !== dod[i].items)
      fail(
        `DoD: секція «${roadmap[i].name}» — ${dod[i].items} рядків проти ${roadmap[i].items} пунктів roadmap`
      );
  }
  return roadmap.length;
};
