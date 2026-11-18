// Юніт-тести check-adr: цитати резолвляться, діапазони — історія, а не цитата.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkAdrCitations } from '../check-adr.mjs';
import { withFixture, messages } from './fixtures.mjs';

const ADR = { 'docs/adr/0001-monorepo.md': '# ADR 0001' };

describe('checkAdrCitations', () => {
  it('існуюча цитата проходить', () =>
    withFixture({ ...ADR, 'backlog/README.md': 'Див. ADR 0001.' }, () => {
      checkAdrCitations(['backlog/README.md']);
      assert.deepEqual(messages(), []);
    }));

  it('діапазон-історія не вважається цитатою', () =>
    withFixture({ ...ADR, 'backlog/README.md': 'Історія: ADR 0022–0047.' }, () => {
      checkAdrCitations(['backlog/README.md']);
      assert.deepEqual(messages(), []);
    }));

  it('фантомна цитата падає з точним діагнозом', () =>
    withFixture({ ...ADR, 'backlog/README.md': 'Див. ADR 9999.' }, () => {
      checkAdrCitations(['backlog/README.md']);
      assert.equal(messages().length, 1);
      assert.match(messages()[0], /ADR 9999.*не резолвиться/);
    }));
});
