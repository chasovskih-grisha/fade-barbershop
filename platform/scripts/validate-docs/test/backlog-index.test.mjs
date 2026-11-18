// Юніт-тести парсинга індексу беклогу: 6 клітинок, статуси, звірка з tasks/.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseBacklogIndex } from '../backlog-index.mjs';
import { withFixture, messages } from './fixtures.mjs';

const row = (
  id,
  slug,
  { name = 'Задача', source = 'a.md', complexity = 'middle', status = 'todo' } = {}
) => `| [${id}](tasks/${slug}.md) | ${name} | ${source} | tags | ${complexity} | ${status} |`;
const index = (...lines) => ['### M0 — Фундамент', ...lines].join('\n');
const files = {
  'backlog/tasks/T-100-skeleton.md': '# T-100',
  'backlog/tasks/T-100a-cors.md': '# T-100a\n**StoryPoints**: 3',
  'backlog/tasks/T-200-other.md': '# T-200',
};
const happy = () =>
  withFixture(
    {
      ...files,
      'backlog/index/m0.md': index(
        row('T-100', 'T-100-skeleton', { status: 'done' }),
        row('T-100a', 'T-100a-cors', {
          name: '└ Слайс: CORS (3 SP)',
          source: 'T-100',
          status: 'done',
        }),
        row('T-200', 'T-200-other')
      ),
    },
    parseBacklogIndex
  );

describe('parseBacklogIndex', () => {
  it('валідний індекс без помилок; слайс розпізнаний за «└»', () => {
    const { rows } = happy();
    assert.deepEqual(messages(), []);
    assert.equal(rows.length, 3);
    assert.deepEqual(
      rows.filter((r) => r.slice).map((r) => r.id),
      ['T-100a']
    );
  });

  it('файл tasks/ без рядка в індексі падає', () =>
    withFixture(
      {
        ...files,
        'backlog/tasks/T-300-orphan.md': '# X',
        'backlog/index/m0.md': index(row('T-100', 'T-100-skeleton', { status: 'done' })),
      },
      () => {
        parseBacklogIndex();
        assert.ok(messages().some((m) => m.includes('T-300-orphan.md: файл без рядка')));
      }
    ));

  it('рядок індексу без файлу падає', () =>
    withFixture({ ...files, 'backlog/index/m0.md': index(row('T-999', 'T-999-ghost')) }, () => {
      parseBacklogIndex();
      assert.ok(messages().some((m) => m.includes('T-999-ghost — немає файлу')));
    }));

  it('дубль slug в індексі падає', () =>
    withFixture(
      {
        ...files,
        'backlog/index/m0.md': index(row('T-200', 'T-200-other'), row('T-201', 'T-200-other')),
      },
      () => {
        parseBacklogIndex();
        assert.ok(messages().some((m) => m.includes('дубль індексу')));
      }
    ));

  it('невідомий статус падає', () =>
    withFixture(
      { ...files, 'backlog/index/m0.md': index(row('T-200', 'T-200-other', { status: 'wip' })) },
      () => {
        parseBacklogIndex();
        assert.ok(messages().some((m) => m.includes('невідомий статус «wip')));
      }
    ));

  it('неекранований «|» у полі дає помилку клітинок', () =>
    withFixture(
      {
        ...files,
        'backlog/index/m0.md': index(row('T-200', 'T-200-other', { name: 'А | Б' })),
      },
      () => {
        parseBacklogIndex();
        assert.ok(messages().some((m) => m.includes('клітинок замість 6')));
      }
    ));

  it('M10 не зливається з M1', () =>
    withFixture(
      {
        'backlog/tasks/T-100-skeleton.md': '# T-100',
        'backlog/tasks/T-900-network.md': '# T-900',
        'backlog/index/m1.md': `### M1 — Ядро\n${row('T-100', 'T-100-skeleton')}`,
        'backlog/index/m10.md': `### M10 — Мережа\n${row('T-900', 'T-900-network')}`,
      },
      () => {
        const { rows } = parseBacklogIndex();
        assert.deepEqual(messages(), []);
        assert.equal(rows.find((r) => r.id === 'T-900').milestone, 'M10');
        assert.equal(rows.find((r) => r.id === 'T-100').milestone, 'M1');
      }
    ));
});
