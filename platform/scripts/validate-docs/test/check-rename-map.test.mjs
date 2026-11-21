// Юніт-тести гейта карти перейменувань (ADR 0055, T-4605a): заборонений суфікс,
// подвоєне суфіксне слово і пара Response/Payload на одне тіло.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRenameMap, doubledSuffix } from '../check-rename-map.mjs';
import { withFixture, messages } from './fixtures.mjs';

const header = [
  '| Old name | File | New name | Category | Rationale |',
  '|----------|------|----------|----------|-----------|',
];
const row = (old, next, category) => `| \`${old}\` | \`a.ts\` | \`${next}\` | ${category} | why |`;
const map = (...rows) => ['# map', '', ...header, ...rows].join('\n');
// errors збираються всередині фікстури: resetContext() чистить їх після run().
const run = (content) =>
  withFixture({ 'docs/dto-rename-map.md': content }, () => {
    let count = 0;
    let threw = false;
    try {
      count = checkRenameMap();
    } catch {
      threw = true;
    }
    return { count, threw, msgs: messages() };
  });

describe('doubledSuffix', () => {
  it('flags a tautology and passes a clean name', () => {
    assert.equal(doubledSuffix('SlotRequestRequest'), true);
    assert.equal(doubledSuffix('SlotQueryRequest'), false);
  });
});

describe('checkRenameMap', () => {
  it('accepts a clean map and returns the row count', () => {
    const { count, msgs } = run(map(row('CreateLocationDto', 'CreateLocationRequest', 'Request')));
    assert.equal(count, 1);
    assert.deepEqual(msgs, []);
  });

  it('rejects a new name that keeps a banned suffix', () => {
    const { msgs } = run(map(row('CreateLocationDto', 'CreateLocationDto', 'Request')));
    assert.match(msgs.join('\n'), /заборонений суфікс/);
  });

  it('rejects a new name without a known suffix', () => {
    const { msgs } = run(map(row('CreateLocationDto', 'CreateLocation', 'Request')));
    assert.match(msgs.join('\n'), /без суфікса/);
  });

  it('rejects a doubled suffix word', () => {
    const { msgs } = run(map(row('SlotRequestDto', 'SlotRequestRequest', 'Request')));
    assert.match(msgs.join('\n'), /подвоєне/);
  });

  it('rejects a Response/Payload pair for the same body', () => {
    const { msgs } = run(
      map(row('FooDto', 'FooResponse', 'Response'), row('FooPayloadDto', 'FooPayload', 'Payload'))
    );
    assert.match(msgs.join('\n'), /межа неоднозначна/);
  });

  it('reports an empty map', () => {
    const { msgs } = run('# map\n\nnothing here');
    assert.match(msgs.join('\n'), /жодного рядка/);
  });
});
