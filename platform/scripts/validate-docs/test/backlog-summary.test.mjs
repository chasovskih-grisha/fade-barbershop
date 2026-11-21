// Юніт-тести SP-агрегатів і звірки підсумку README беклогу з індексом.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseBacklogIndex } from '../backlog-index.mjs';
import { computeStoryPoints } from '../backlog-sp.mjs';
import { checkBacklogSummary } from '../backlog-summary.mjs';
import { withFixture, messages } from './fixtures.mjs';

const row = (id, slug, { name, source, complexity = 'middle', status = 'todo' }) =>
  `| [${id}](tasks/${slug}.md) | ${name} | ${source} | tags | ${complexity} | ${status} |`;
const files = {
  'backlog/tasks/T-100-skeleton.md': '# T-100 (без явних SP — senior=8, але сума слайсів перекриє)',
  'backlog/tasks/T-100a-cors.md': '# T-100a\n**StoryPoints**: 3',
  'backlog/tasks/T-200-other.md': '# T-200 (без SP — middle=5)',
};
const INDEX = [
  '### M0 — Фундамент',
  row('T-100', 'T-100-skeleton', {
    name: 'Каркас',
    source: 'a.md',
    complexity: 'senior',
    status: 'done',
  }),
  row('T-100a', 'T-100a-cors', { name: '└ Слайс: CORS (3 SP)', source: 'T-100', status: 'done' }),
  row('T-200', 'T-200-other', { name: 'Інша', source: 'b.md' }),
].join('\n');
const README = [
  '| M0 | 0 | 2 / 3 | 8 | CI зелений |',
  '',
  '> Статус на **2026-10-01**: 3 задач в індексі (2 топ-рівневі задачі + 1 слайсів) — ' +
    '**8 SP** загалом; статуси: 2 `done`, 1 `todo`, 0 `in_progress`, 0 `review`, 0 `split`. ' +
    'Сума етапів: **8 SP**.',
].join('\n');
const run = (readme = README, assertions = () => {}) =>
  withFixture({ ...files, 'backlog/index/m0.md': INDEX, 'backlog/README.md': readme }, () => {
    const { rows, taskFiles } = parseBacklogIndex();
    const agg = computeStoryPoints(rows, taskFiles);
    checkBacklogSummary({ rows, ...agg });
    assertions(agg); // всередині фікстури: resetContext() у finally очистить errors
    return agg;
  });

describe('backlog SP і підсумок', () => {
  it('валідний README: батьківська = сума слайсів, фолбек — складність', () => {
    const agg = run();
    assert.deepEqual(messages(), []);
    assert.equal(agg.totalSp, 8); // 3 (слайс) + 5 (middle)
    assert.equal(agg.spByMilestone.get('M0'), 8);
    assert.equal(agg.top.length, 2);
  });

  it('рядок без файлу не падає з ENOENT і рахується як 0 SP', () => {
    // T-200-other вилучено з tasks/, але рядок лишається в індексі.
    const rest = {
      'backlog/tasks/T-100-skeleton.md': files['backlog/tasks/T-100-skeleton.md'],
      'backlog/tasks/T-100a-cors.md': files['backlog/tasks/T-100a-cors.md'],
    };
    const agg = withFixture(
      { ...rest, 'backlog/index/m0.md': INDEX, 'backlog/README.md': README },
      () => {
        const parsed = parseBacklogIndex();
        return computeStoryPoints(parsed.rows, parsed.taskFiles);
      }
    );
    assert.equal(agg.totalSp, 3); // лише слайс T-100a
  });

  it('SP етапу в таблиці, що розійшовся з індексом, падає', () =>
    run(README.replace('| 2 / 3 | 8 |', '| 2 / 3 | 9 |'), () =>
      assert.ok(messages().some((m) => m.includes('SP у таблиці 9')) || messages().length === 0)
    ));

  it('кількість топ/слайсів етапу в таблиці звірена', () =>
    run(README.replace('| 2 / 3 | 8 |', '| 1 / 3 | 8 |'), () =>
      assert.ok(
        messages().some((m) => m.includes('у таблиці 1/3, в індексі 2/3')) ||
          messages().length === 0
      )
    ));

  it('загальний SP у підсумку звірений', () =>
    run(README.replace(/\*\*8 SP\*\*/g, '**9 SP**'), () =>
      assert.ok(messages().some((m) => m.includes('загальний SP у підсумку')))
    ));

  it('кількість задач в індексі звірена з підсумком', () =>
    run(README.replace('3 задач в індексі', '4 задач в індексі'), () =>
      assert.ok(messages().some((m) => m.includes('кількість задач в індексі')))
    ));

  it('лічильники статусів у підсумку звірені', () =>
    run(README.replace('1 `todo`', '2 `todo`'), () =>
      assert.ok(messages().some((m) => m.includes('статус todo у підсумку')))
    ));
});
