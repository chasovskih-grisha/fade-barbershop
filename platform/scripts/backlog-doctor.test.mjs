import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnose, parseRows, tagsFromTask } from './backlog-doctor.mjs';

const index = [
  '# M2',
  '### M2 test',
  '| [T-1](../tasks/T-1.md) | A | src | backend, frontend | middle | todo |',
  '| [T-2](../tasks/T-2.md) | B | src | backend | middle | done |',
].join('\n');

test('parses rows and tags', () => {
  const rows = parseRows(index);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].tags, ['backend', 'frontend']);
  assert.deepEqual(tagsFromTask('- **Tags**: backend, high-risk'), ['backend', 'high-risk']);
});

test('structural errors fail and cross-seat tasks are warnings', () => {
  const result = diagnose({
    rows: parseRows(index),
    taskFiles: ['T-1', 'T-2'],
    taskText: () => '',
  });
  assert.deepEqual(result.errors, []);
  assert.match(result.warnings[0], /T-1 todo: cross-seat/);
});

test('missing files and duplicate ids are errors', () => {
  const result = diagnose({
    rows: [...parseRows(index), ...parseRows(index)],
    taskFiles: ['T-2', 'T-3'],
    taskText: () => '',
  });
  assert.ok(result.errors.some((error) => error.includes('duplicate id T-1')));
  assert.ok(result.errors.some((error) => error.includes('T-1.md')));
  assert.ok(result.errors.some((error) => error.includes('T-3.md has no index row')));
});

test('status and Done checkboxes drift is a warning', () => {
  const result = diagnose({
    rows: parseRows(index),
    taskFiles: ['T-1', 'T-2'],
    taskText: (slug) => (slug === 'T-2' ? '## Done\n\n- [ ] unfinished\n' : '## Done\n\n- [x] finished\n'),
  });
  assert.ok(result.warnings.some((warning) => warning.includes('T-2 done but its Done items are unchecked')));
});
