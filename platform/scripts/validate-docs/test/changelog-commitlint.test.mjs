import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { validateCommitMessage } from '../../validate-commit.mjs';
import { generateChangelogContent } from '../../generate-changelog.mjs';

test('commitlint validates conventional commit messages correctly', () => {
  assert.strictEqual(validateCommitMessage('feat(auth): add login otp'), true);
  assert.strictEqual(validateCommitMessage('fix: correct sql query'), true);
  assert.strictEqual(validateCommitMessage('random invalid commit message'), false);
});

test('changelog generator produces markdown content', () => {
  const content = generateChangelogContent();
  assert.strictEqual(typeof content, 'string');
  assert.ok(content.includes('# Changelog'));
});

test('AGENTS.md contains conventional commit format guidelines', () => {
  const agentsContent = fs.readFileSync('AGENTS.md', 'utf8');
  assert.ok(agentsContent.includes('Conventional Commits'));
});
