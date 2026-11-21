// Перевірка 6: карта перейменувань (docs/dto-rename-map.md) не містить суперечностей.
// Правило — ADR 0055: три суфікси Request/Response/Payload, жодного Dto/Input/Result/
// ErrorBody, жодного подвоєння суфіксного слова, і одне тіло не має пари Response/Payload.
// Це гейт на документ T-4605a, не на код (механічне перейменування — T-4605b…e).

import { read, fail } from './context.mjs';

const MAP_FILE = 'docs/dto-rename-map.md';
const BANNED = /(Dto|Input|Result|ErrorBody)$/;
const SUFFIX = /(Request|Response|Payload)$/;

const rowRe = /^\|\s*`([^`]+)`\s*\|[^|]*\|\s*`([^`]+)`\s*\|\s*([A-Za-z]+)\s*\|/;

const words = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' ');

/** Останній суфікс і слово перед ним: для RequestRequest-подібних тавтологій. */
export const doubledSuffix = (name) => {
  const parts = words(name);
  return parts.length >= 2 && parts.at(-1) === parts.at(-2);
};

/** Проверки одного рядка; повертає тіло для карти Response/Payload-пар або null. */
const checkRow = ({ old, next, category }) => {
  if (BANNED.test(next)) {
    fail(`${MAP_FILE}: «${old}» → «${next}» — нове імʼя лишає заборонений суфікс (ADR 0055)`);
    return null;
  }
  if (!SUFFIX.test(next)) {
    fail(`${MAP_FILE}: «${old}» → «${next}» — нове імʼя без суфікса Request/Response/Payload`);
    return null;
  }
  if (doubledSuffix(next))
    fail(`${MAP_FILE}: «${old}» → «${next}» — суфіксне слово подвоєне (тавтологія)`);
  if (category !== 'Response' && category !== 'Payload') return null;
  return { body: next.replace(/(Response|Payload)$/, ''), category };
};

export const checkRenameMap = () => {
  const rows = [];
  for (const line of read(MAP_FILE).split('\n')) {
    const m = line.match(rowRe);
    if (m) rows.push({ old: m[1], next: m[2], category: m[3] });
  }
  if (rows.length === 0) fail(`${MAP_FILE}: жодного рядка карти перейменувань`);

  const byBody = new Map();
  for (const row of rows) {
    const body = checkRow(row);
    if (!body) continue;
    if (byBody.has(body.body) && byBody.get(body.body) !== body.category)
      fail(`${MAP_FILE}: тіло «${body.body}» має і Response, і Payload — межа неоднозначна`);
    byBody.set(body.body, body.category);
  }
  return rows.length;
};
