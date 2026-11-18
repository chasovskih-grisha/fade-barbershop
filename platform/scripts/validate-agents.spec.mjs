import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateAgents } from './validate-agents.mjs';

const role = (name, writesProduct) =>
  `---\nname: ${name}\nwrites_product: ${writesProduct}\n---\n\n${name}\n`;

const domain = (seat, domainName, tag, owns, except = []) => {
  const exceptBlock = except.length
    ? `\nexcept:\n${except.map((path) => `  - ${path}`).join('\n')}`
    : '';
  return `---\nseat: ${seat}\ndomain: ${domainName}\ntag: ${tag}\nowns:\n${owns.map((path) => `  - ${path}`).join('\n')}${exceptBlock}\n---\n\n${domainName}\n`;
};

const automation = (name, kind, seat) =>
  `---\nname: ${name}\nkind: ${kind}\nseat: ${seat}\ncron: "0 7 * * *"\nmodel: flash_lite\nskills: [discover-task]\n---\n\n${name}\n`;

const fixture = async (files) => {
  const root = await mkdtemp(join(tmpdir(), 'agents-'));
  for (const [rel, body] of Object.entries(files)) {
    const path = join(root, rel);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, body);
  }
  return root;
};

test('overlapping owns names both seats', async () => {
  const root = await fixture({
    'agents/roles/frontend-developer/domains/web.md': domain(
      'frontend-developer',
      'web',
      'frontend',
      ['apps/web']
    ),
    'agents/roles/seo/domains/seo.md': domain('seo', 'seo', 'seo', ['apps/web']),
  });
  const result = validateAgents(root);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /frontend-developer/);
  assert.match(result.errors.join('\n'), /seo/);
  await rm(root, { recursive: true });
});

test('discover seat must not own apps or packages', async () => {
  const root = await fixture({
    'agents/roles/product-owner/ROLE.md': role('product-owner', false),
    'agents/roles/product-owner/domains/backlog.md': domain('product-owner', 'backlog', '', [
      'apps/web',
    ]),
    'agents/roles/product-owner/automations/discover-backlog.md': automation(
      'discover-backlog',
      'discover',
      'product-owner'
    ),
  });
  const result = validateAgents(root);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /discover/);
  await rm(root, { recursive: true });
});

test('kind must be discover, implement, or accept', async () => {
  const root = await fixture({
    'agents/roles/qa/automations/patrol.md': automation('patrol', 'patrol', 'qa'),
  });
  const result = validateAgents(root);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /patrol/);
  await rm(root, { recursive: true });
});

test('hyphenated flash-lite is not the Flash Lite tier', async () => {
  const root = await fixture({
    'agents/roles/qa/automations/accept-review.md': automation(
      'accept-review',
      'accept',
      'qa'
    ).replace('model: flash_lite', 'model: flash-lite'),
  });
  const result = validateAgents(root);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /flash-lite/);
  await rm(root, { recursive: true });
});

test('except keeps a carved-out path from counting as overlap', async () => {
  const root = await fixture({
    'agents/roles/frontend-developer/ROLE.md': role('frontend-developer', true),
    'agents/roles/seo/ROLE.md': role('seo', true),
    'agents/roles/frontend-developer/domains/web.md': domain(
      'frontend-developer',
      'web',
      'frontend',
      ['apps/web'],
      ['apps/web/src/lib/seo']
    ),
    'agents/roles/seo/domains/seo.md': domain('seo', 'seo', 'seo', ['apps/web/src/lib/seo']),
  });
  const result = validateAgents(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
  await rm(root, { recursive: true });
});
