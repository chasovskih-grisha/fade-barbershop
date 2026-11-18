// Юніт-тести DoD ↔ roadmap: секції, назви і кількість пунктів звірені.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkDodRoadmap } from '../check-dod.mjs';
import { withFixture, messages } from './fixtures.mjs';

const roadmapSection = (name, items) =>
  [`### ${name}`, ...items.map((i) => `- [ ] ${i}`)].join('\n');
const roadmap = (...sections) =>
  ['# Roadmap', '## Чеклист запуску v1', ...sections, '## Поза scope', '- далеке'].join('\n');
const dodSection = (name, rows) =>
  [`## ${name}`, ...Array.from({ length: rows }, (_, i) => `| 0.${i + 1} | критерій |`)].join('\n');
const dod = (...sections) =>
  ['# Definition of Done', ...sections, '## Звідки брати', 'з roadmap'].join('\n');
const run = (roadmapMd, dodMd, assertions = () => {}) =>
  withFixture({ 'docs/roadmap.md': roadmapMd, 'backlog/definition-of-done.md': dodMd }, () => {
    const n = checkDodRoadmap();
    assertions(n); // всередині фікстури: resetContext() у finally очистить errors
    return n;
  });

describe('checkDodRoadmap', () => {
  it('однакові секції з однаковою кількістю пунктів проходять', () => {
    const n = run(
      roadmap(roadmapSection('Фаза 0', ['a', 'b']), roadmapSection('Фаза 1', ['c'])),
      dod(dodSection('Фаза 0', 2), dodSection('Фаза 1', 1))
    );
    assert.deepEqual(messages(), []);
    assert.equal(n, 2);
  });

  it('кількість секцій звірена', () =>
    run(
      roadmap(roadmapSection('Фаза 0', ['a']), roadmapSection('Фаза 1', ['b'])),
      dod(dodSection('Фаза 0', 1)),
      () => assert.ok(messages().some((m) => m.includes('1 секцій проти 2')))
    ));

  it('назви секцій звірені', () =>
    run(roadmap(roadmapSection('Фаза 0', ['a'])), dod(dodSection('Інша фаза', 1)), () =>
      assert.ok(messages().some((m) => m.includes('≠')))
    ));

  it('кількість пунктів у секції звірена', () =>
    run(roadmap(roadmapSection('Фаза 0', ['a', 'b'])), dod(dodSection('Фаза 0', 3)), () =>
      assert.ok(messages().some((m) => m.includes('рядків проти')))
    ));

  it('секції без пунктів ігноруються в обох документах', () => {
    const n = run(
      roadmap(roadmapSection('Порожня', []), roadmapSection('Фаза 0', ['a'])),
      dod(dodSection('Порожня', 0), dodSection('Фаза 0', 1))
    );
    assert.deepEqual(messages(), []);
    assert.equal(n, 1);
  });
});
