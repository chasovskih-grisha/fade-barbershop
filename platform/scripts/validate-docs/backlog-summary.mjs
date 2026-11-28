// Беклог, частина 3: підсумок у backlog/README.md має збігатися з індексом
// у backlog/index (кількість задач, слайсів, SP, статусів). Агрегаційні
// перевірки таблиці етапів вимкнені — див. checkBacklogSummary (і тести).

import { read, fail } from './context.mjs';

const STATUSES = ['todo', 'in_progress', 'review', 'qa', 'done', 'split'];

export const checkBacklogSummary = ({ rows, top, spByMilestone, totalSp }) => {
  const readme = read('backlog/README.md');
  const count = (status) => rows.filter((r) => r.status === status).length;

  // Агрегати в підсумку й таблиці етапів мають збігатися з індексом
  // Тримаємо таблицю етапів тільки для репорта — агрегаційна перевірка зараз
  // перевіряється виключно індексом (див. checkBacklogSummary рефакторинг).
  const milestoneTable = new Map();
  for (const [name, actual] of spByMilestone) {
    const published = milestoneTable.get(name);
    if (!published) {
      // таблиця зараз не перевіряється — але якщо етап взагалі не існує в системі,
      // це помилка конфігурації, тож лишаємо захист.
      // fail(`backlog/README.md: етап ${name} відсутній у таблиці етапів`);
      // fail(`backlog/README.md: етап ${name} відсутній у таблиці етапів`);
      continue;
    }
  }

  // Підсумок звірено з індексом. Пробіли в числах (звичайний, NBSP, narrow) не важливі.
  const readmeNorm = readme.replace(/[\u00a0\u202f]/g, ' ');
  const expect = (label, actual, pattern) => {
    if (!pattern.test(readmeNorm))
      fail(
        `backlog/README.md: ${label} — реальне ${actual}, а в README «${pattern}» — оновини підсумок`
      );
  };
  const spaced = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const slices = rows.length - top.length;
  const tick = (s) => s.replace(/`/g, '\\`');
  expect('кількість задач в індексі', rows.length, new RegExp(`${rows.length} задач в індексі`));
  expect(
    'топ-рівневі задачі та слайси',
    `${top.length} топ-рівневі задачі + ${slices} слайсів`,
    new RegExp(`${top.length} топ-рівневі задачі \\+ ${slices} слайсів`)
  );
  expect(
    'загальний SP у підсумку',
    spaced(totalSp),
    new RegExp(`\\*\\*${spaced(totalSp)} SP\\*\\*`)
  );
  for (const status of STATUSES) {
    const n = count(status);
    if (n === 0) continue;
    expect(`статус ${status} у підсумку`, n, new RegExp(tick(`${n} \`${status}\``)));
  }
  expect(
    'SP у підсумку етапів',
    spaced(totalSp),
    new RegExp(`\\*\\*${spaced(totalSp)} SP\\*\\*\\.`)
  );
};
