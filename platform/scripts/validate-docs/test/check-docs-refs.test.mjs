// Юніт-тести check-docs-refs: фантомні згадки падають, анотовані — виняток.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkDocsRefs } from '../check-docs-refs.mjs';
import { withFixture, messages } from './fixtures.mjs';

const DOCS = { 'docs/real.md': '# Real' };

describe('checkDocsRefs', () => {
  it('існуюча згадка проходить', () =>
    withFixture({ ...DOCS, 'backlog/README.md': 'Див. docs/real.md.' }, () => {
      checkDocsRefs(['backlog/README.md']);
      assert.deepEqual(messages(), []);
    }));

  it('фантомна згадка падає', () =>
    withFixture({ ...DOCS, 'backlog/README.md': 'Див. docs/ghost.md.' }, () => {
      checkDocsRefs(['backlog/README.md']);
      assert.equal(messages().length, 1);
      assert.match(messages()[0], /docs\/ghost\.md.*не існує/);
    }));

  it('анотований фантом — виняток (документація відсутності)', () =>
    withFixture(
      {
        ...DOCS,
        'backlog/README.md': 'docs/ghost.md ніколи не існував — це документація відсутності.',
      },
      () => {
        checkDocsRefs(['backlog/README.md']);
        assert.deepEqual(messages(), []);
      }
    ));
});
