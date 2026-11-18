// Юніт-тести check-traceability: статуси рядків звірені з [x] файлів AC,
// некоректні статуси і межі діапазонів падають, формат рядка контролюється.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkTraceability } from '../check-traceability.mjs';
import { withFixture, messages } from './fixtures.mjs';

// Рядок трейсабіліті: 5 колонок — Критерії (з ID) / Контекст / Фаза / Статус / Примітка.
const row = (cell, status) => `| ${cell} | контекст | фаза | ${status} | — |`;
const run = (acBody, rowLine, assertions) =>
  withFixture(
    {
      'docs/acceptance-criteria/traceability.md': [
        '## 01 — Зона (`01-zone.md`)',
        '| Критерії | Контекст | Фаза | Статус | Примітка |',
        rowLine,
      ].join('\n'),
      'docs/acceptance-criteria/01-zone.md': acBody,
    },
    () => {
      const groups = checkTraceability();
      assertions(groups); // всередині фікстури: resetContext() після finally очистить errors
    }
  );

describe('checkTraceability', () => {
  it('«у роботі» з [x]-критеріями проходить', () =>
    run('# Група\n- [x] **RO-001.** Зроблено', row('RO-001', 'у роботі'), () => {
      assert.deepEqual(messages(), []);
    }));

  it('«у роботі» без жодного [x] у групі падає', () =>
    run('# Група\n- [ ] **RO-001.** План', row('RO-001', 'у роботі'), () => {
      assert.equal(messages().length, 1);
      assert.match(messages()[0], /у групі немає жодного \[x\]/);
    }));

  it('«—» при повністю прийнятій групі падає', () =>
    run('# Група\n- [x] **RO-001.** Зроблено', row('RO-001', '—'), () => {
      assert.equal(messages().length, 1);
      assert.match(messages()[0], /«—», але всі критерії групи \[x\]/);
    }));

  it('межа діапазону без файлу AC падає', () =>
    run(
      '# Група\n- [x] **RO-001.** Зроблено\n- [ ] **RO-002.** Ні',
      row('RO-001…RO-009', '—'),
      () => {
        assert.match(messages().join(' '), /«RO-009» відсутня у файлі AC/);
      }
    ));

  it('некоректний статус падає', () =>
    run('# Група\n- [x] **RO-001.** Зроблено', row('RO-001', 'done'), () => {
      assert.match(messages().join(' '), /некоректний статус/);
    }));

  it('неправильна кількість клітинок падає', () =>
    run('# Група\n- [x] **RO-001.** Зроблено', '| RO-001 | назва | джерело | у роботі |', () => {
      assert.match(messages().join(' '), /клітинок замість 6/);
    }));
});
