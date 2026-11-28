import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { rmSync } from 'node:fs';
// Promisified counterparts: fs.mkdtemp/readFile without a callback throw on the
// Node versions this repo runs, which silently broke every temp-repo test.
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  assessRange,
  claimBlock,
  claimTask,
  dependencyIds,
  nextTasks,
  doneTask,
  parseIndexRow,
  planProblems,
  qaTask,
  replaceStatus,
  reviewTask,
  substantialFiles,
  verifyRange,
} from './agent-gate.mjs';
import { planStart, planSync, runPreflight } from './agent-preflight.mjs';
import { installGateHook } from './render-antigravity-sidecars.mjs';

const owns = { owns: ['apps/api/src/scheduling'], except: [] };
const row = parseIndexRow('| [T-1](../tasks/T-1.md) | Lock | — | backend | middle | todo |');

const plan = `# T-1

## Implementation plan

Paths:
- apps/api/src/scheduling/lock.ts
- apps/api/src/scheduling/lock.test.mjs

Checks:
- node --test apps/api/src/scheduling/lock.test.mjs
`;

const testPatch = `diff --git a/apps/api/src/scheduling/lock.test.mjs b/apps/api/src/scheduling/lock.test.mjs
--- /dev/null
+++ b/apps/api/src/scheduling/lock.test.mjs
@@ -0,0 +1,5 @@
+import test from 'node:test';
+import assert from 'node:assert/strict';
+test('lock returns 1', () => {
+  assert.equal(1, 1);
+});
`;

const realPatch = `diff --git a/apps/api/src/scheduling/lock.ts b/apps/api/src/scheduling/lock.ts
--- /dev/null
+++ b/apps/api/src/scheduling/lock.ts
@@ -0,0 +1,3 @@
+export function lock() {
+  return 1;
+}
`;

test('a review that only edits the backlog is refused', () => {
  const result = assessRange({
    changes: [{ id: 'T-1', from: 'in_progress', to: 'review', tags: ['backend'], taskText: plan }],
    files: ['backlog/index/m0.md', 'backlog/journal/2026-11.md'],
    patches: {},
    ownsByTag: { backend: owns },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /not an implementation/);
});

test('a one-line stub and a comment are not an implementation', () => {
  const stub = substantialFiles(
    {
      'apps/api/src/scheduling/lock.ts':
        '+\n+export default function GiftPage() { return <div>Gift</div> }\n',
    },
    owns
  );
  const comment = substantialFiles(
    { 'apps/api/src/scheduling/lock.ts': '+\n+// T-250 verified\n' },
    owns
  );
  const markdown = substantialFiles(
    { 'apps/api/src/scheduling/LOCK.md': '+\n+Loyalty free visit implementation\n' },
    owns
  );
  assert.deepEqual(stub, []);
  assert.deepEqual(comment, []);
  assert.deepEqual(markdown, []);
  assert.equal(planProblems('# T\n', owns), 'implementation plan names no owned path');
  assert.equal(
    planProblems(
      plan.replace(
        'node --test apps/api/src/scheduling/lock.test.mjs',
        'node -e "process.exit(0)"'
      ),
      owns
    ),
    'implementation plan check does not run the test'
  );
});

test('two craft tags are not claimable', () => {
  const blocked = claimBlock(
    { ...row, tags: ['frontend'] },
    '- **Tags**: frontend, design, high-risk\n',
    new Map(),
    'frontend'
  );
  assert.match(blocked, /2 craft tags/);
});

test('a product diff without a new test is refused', () => {
  const result = assessRange({
    changes: [{ id: 'T-1', from: 'in_progress', to: 'review', tags: ['backend'], taskText: plan }],
    files: ['apps/api/src/scheduling/lock.ts'],
    patches: { 'apps/api/src/scheduling/lock.ts': realPatch },
    ownsByTag: { backend: owns },
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /does not add a test/);
});

test('in_progress cannot jump to qa', () => {
  const recorded = `${plan}\n## QA\n\n- \`node --test apps/api/src/scheduling/lock.test.mjs\` exit 0\n`;
  const result = assessRange({
    changes: [{ id: 'T-1', from: 'in_progress', to: 'qa', tags: ['backend'], taskText: recorded }],
    files: ['backlog/index/m0.md', 'backlog/tasks/T-1.md'],
    ownsByTag: { backend: owns },
  });
  assert.match(result.errors.join('\n'), /cannot move from in_progress to qa/);
});

test('review notes must list the files the diff actually changed', () => {
  const notes = `${plan}\n## Implementation notes\n\n- apps/api/src/scheduling/lock.test.mjs\n- apps/api/src/scheduling/lock.ts\n`;
  const result = assessRange({
    changes: [{ id: 'T-1', from: 'in_progress', to: 'review', tags: ['backend'], taskText: notes }],
    files: [
      'apps/api/src/scheduling/lock.ts',
      'apps/api/src/scheduling/lock.test.mjs',
      'backlog/index/m0.md',
    ],
    patches: {
      'apps/api/src/scheduling/lock.ts': realPatch,
      'apps/api/src/scheduling/lock.test.mjs': testPatch,
    },
    ownsByTag: { backend: owns },
  });
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(replaceStatus(row.line, 'review').trim().endsWith('| review |'), true);
});

test('done requires the QA record and no product diff', () => {
  const recorded = `${plan}\n## QA\n\n- \`node --test apps/api/src/scheduling/lock.test.mjs\` exit 0\n`;
  const refused = assessRange({
    changes: [{ id: 'T-1', from: 'qa', to: 'done', tags: ['backend'], taskText: plan }],
    files: ['backlog/index/m0.md'],
    ownsByTag: { backend: owns },
  });
  assert.equal(refused.ok, false);
  const withProduct = assessRange({
    changes: [{ id: 'T-1', from: 'qa', to: 'done', tags: ['backend'], taskText: recorded }],
    files: ['apps/api/src/scheduling/lock.ts'],
    ownsByTag: { backend: owns },
  });
  assert.match(withProduct.errors.join('\n'), /product files/);
  const samePush = assessRange({
    changes: [{ id: 'T-1', from: 'qa', to: 'done', tags: ['backend'], taskText: recorded }],
    files: ['backlog/index/m0.md'],
    ownsByTag: { backend: owns },
  });
  assert.match(samePush.errors.join('\n'), /not on origin\/stage/);
  const allowed = assessRange({
    changes: [{ id: 'T-1', from: 'qa', to: 'done', tags: ['backend'], taskText: recorded }],
    files: ['backlog/index/m0.md'],
    ownsByTag: { backend: owns },
    publishedQa: new Set(['T-1']),
  });
  assert.equal(allowed.ok, true, allowed.errors.join('\n'));
});

test('preflight skips an empty queue and a dirty tree', () => {
  assert.equal(planSync(['backlog/index/m0.md']), 'discard');
  assert.equal(planSync(['apps/api/src/scheduling/lock.ts']), 'publish');
  assert.equal(planSync([]), 'reset-if-behind');
  assert.deepEqual(planStart({ kind: 'implement', eligible: 0 }), {
    action: 'skip',
    reason: 'no ready todo',
  });
  assert.equal(planStart({ kind: 'implement', eligible: 0, inProgress: 1 }).action, 'start');
  assert.equal(
    planStart({ kind: 'accept', realReviews: 0, statusOnlyReviews: 2 }).action,
    'withdraw'
  );
  let started = false;
  const code = runPreflight({
    dirty: () => true,
    finish: (status) => status,
    start: () => {
      started = true;
      return 0;
    },
  });
  assert.equal(code, 0);
  assert.equal(started, false);
});

const git = (repo, args) =>
  execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
    },
  });

async function repoWithTask() {
  const root = await mkdtemp(join(tmpdir(), 'gate-'));
  git(root, ['init', '-b', 'stage']);
  await mkdir(join(root, 'backlog', 'index'), { recursive: true });
  await mkdir(join(root, 'backlog', 'tasks'), { recursive: true });
  await mkdir(join(root, 'backlog', 'journal'), { recursive: true });
  await mkdir(join(root, 'agents', 'roles', 'backend-developer', 'domains'), { recursive: true });
  await writeFile(
    join(root, 'backlog', 'index', 'm0.md'),
    '| [T-1](../tasks/T-1.md) | Lock | — | backend | middle | todo |\n'
  );
  await writeFile(join(root, 'backlog', 'tasks', 'T-1.md'), '# T-1\n\n- **Tags**: backend\n');
  await writeFile(join(root, 'backlog', 'journal', '2026-11.md'), '# Journal\n\n');
  await writeFile(
    join(root, 'agents', 'roles', 'backend-developer', 'domains', 'scheduling.md'),
    '---\nseat: backend-developer\ndomain: scheduling\ntag: backend\nowns:\n  - apps/api/src/scheduling\n---\n\nscheduling\n'
  );
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'init']);
  git(root, ['update-ref', 'refs/remotes/origin/stage', 'HEAD']);
  return root;
}

test('review commits only when an owned file changed', async () => {
  const root = await repoWithTask();
  const previous = {
    name: process.env.GIT_AUTHOR_NAME,
    email: process.env.GIT_AUTHOR_EMAIL,
    cname: process.env.GIT_COMMITTER_NAME,
    cemail: process.env.GIT_COMMITTER_EMAIL,
  };
  process.env.GIT_AUTHOR_NAME = 'test';
  process.env.GIT_AUTHOR_EMAIL = 'test@example.com';
  process.env.GIT_COMMITTER_NAME = 'test';
  process.env.GIT_COMMITTER_EMAIL = 'test@example.com';
  try {
    assert.throws(
      () => claimTask(root, 'backend-developer', { push: false }),
      /implementation plan/
    );
    await writeFile(
      join(root, 'backlog', 'tasks', 'T-1.md'),
      '# T-1\n\n- **Tags**: backend\n\n## Implementation plan\n\nPaths:\n- apps/api/src/scheduling/lock.mjs\n\nChecks:\n- node -e "process.exit(0)"\n'
    );
    assert.throws(() => claimTask(root, 'backend-developer', { push: false }), /names no test/);
    await writeFile(
      join(root, 'backlog', 'tasks', 'T-1.md'),
      '# T-1\n\n- **Tags**: backend\n\n## Implementation plan\n\nPaths:\n- apps/api/src/scheduling/lock.mjs\n- apps/api/src/scheduling/lock.test.mjs\n\nChecks:\n- node --test apps/api/src/scheduling/lock.test.mjs\n'
    );
    assert.equal(claimTask(root, 'backend-developer', { push: false }), 'T-1');
    await mkdir(join(root, 'apps', 'api', 'src', 'scheduling'), { recursive: true });
    await writeFile(
      join(root, 'apps', 'api', 'src', 'scheduling', 'lock.mjs'),
      'export const lock = 1;\n'
    );
    assert.throws(
      () => reviewTask(root, 'backend-developer', 'T-1', { push: false }),
      /not an implementation/
    );
    await writeFile(
      join(root, 'apps', 'api', 'src', 'scheduling', 'lock.mjs'),
      'export function lock() {\n  return 1;\n}\n'
    );
    assert.throws(
      () => reviewTask(root, 'backend-developer', 'T-1', { push: false }),
      /does not add a test/
    );
    await writeFile(
      join(root, 'apps', 'api', 'src', 'scheduling', 'lock.test.mjs'),
      "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { lock } from './lock.mjs';\n\ntest('lock returns 1', () => {\n  assert.equal(lock(), 1);\n});\n"
    );
    assert.equal(reviewTask(root, 'backend-developer', 'T-1', { push: false }), 'T-1');
    assert.equal(qaTask(root, 'T-1', { push: false }), 'T-1');
    const origin = git(root, ['rev-parse', 'origin/stage']).trim();
    const qaSha = git(root, ['rev-parse', 'HEAD']).trim();
    assert.throws(() => doneTask(root, 'T-1', { push: false }), /not on origin\/stage/);
    await writeFile(join(root, '.agent-run'), `${origin}\n`);
    assert.throws(() => doneTask(root, 'T-1', { push: false }), /not on origin\/stage/);
    await writeFile(join(root, '.agent-run'), `${qaSha}\n`);
    assert.equal(doneTask(root, 'T-1', { push: false }), 'T-1');
    const head = git(root, ['rev-parse', 'HEAD']).trim();
    const throughQa = verifyRange(root, origin, qaSha);
    assert.equal(throughQa.ok, true, throughQa.errors.join('\n'));
    const samePush = verifyRange(root, origin, head);
    assert.match(samePush.errors.join('\n'), /not on origin\/stage/);
    const laterRun = verifyRange(root, qaSha, head);
    assert.equal(laterRun.ok, true, laterRun.errors.join('\n'));
    const task = await readFile(join(root, 'backlog', 'tasks', 'T-1.md'), 'utf8');
    assert.match(task, /## Implementation notes/);
    assert.match(task, /## QA/);
    assert.match(task, /exit 0/);
  } finally {
    process.env.GIT_AUTHOR_NAME = previous.name;
    process.env.GIT_AUTHOR_EMAIL = previous.email;
    process.env.GIT_COMMITTER_NAME = previous.cname;
    process.env.GIT_COMMITTER_EMAIL = previous.cemail;
    await rm(root, { recursive: true, force: true });
  }
});

test('qa refuses a test that still passes without the product file', async () => {
  const root = await repoWithTask();
  const previous = {
    name: process.env.GIT_AUTHOR_NAME,
    email: process.env.GIT_AUTHOR_EMAIL,
    cname: process.env.GIT_COMMITTER_NAME,
    cemail: process.env.GIT_COMMITTER_EMAIL,
  };
  process.env.GIT_AUTHOR_NAME = 'test';
  process.env.GIT_AUTHOR_EMAIL = 'test@example.com';
  process.env.GIT_COMMITTER_NAME = 'test';
  process.env.GIT_COMMITTER_EMAIL = 'test@example.com';
  try {
    await writeFile(
      join(root, 'backlog', 'tasks', 'T-1.md'),
      '# T-1\n\n- **Tags**: backend\n\n## Implementation plan\n\nPaths:\n- apps/api/src/scheduling/lock.mjs\n- apps/api/src/scheduling/lock.test.mjs\n\nChecks:\n- node --test apps/api/src/scheduling/lock.test.mjs\n'
    );
    claimTask(root, 'backend-developer', { push: false });
    await mkdir(join(root, 'apps', 'api', 'src', 'scheduling'), { recursive: true });
    await writeFile(
      join(root, 'apps', 'api', 'src', 'scheduling', 'lock.mjs'),
      'export function lock() {\n  return 1;\n}\n'
    );
    await writeFile(
      join(root, 'apps', 'api', 'src', 'scheduling', 'lock.test.mjs'),
      "import test from 'node:test';\nimport assert from 'node:assert/strict';\n\ntest('always passes', () => {\n  assert.equal(1, 1);\n});\n"
    );
    reviewTask(root, 'backend-developer', 'T-1', { push: false });
    assert.throws(
      () => qaTask(root, 'T-1', { push: false }),
      /still passes without the product diff/
    );
    const task = await readFile(join(root, 'backlog', 'tasks', 'T-1.md'), 'utf8');
    assert.doesNotMatch(task, /## QA/);
  } finally {
    process.env.GIT_AUTHOR_NAME = previous.name;
    process.env.GIT_AUTHOR_EMAIL = previous.email;
    process.env.GIT_COMMITTER_NAME = previous.cname;
    process.env.GIT_COMMITTER_EMAIL = previous.cemail;
    await rm(root, { recursive: true, force: true });
  }
});

test('installGateHook copies pre-push into the git dir', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hook-'));
  git(root, ['init', '-b', 'stage']);
  await mkdir(join(root, 'hooks'), { recursive: true });
  await writeFile(join(root, 'hooks', 'pre-push'), '#!/bin/sh\necho agent-gate\n');
  const dests = installGateHook(root);
  const installed = await readFile(join(dests[0], 'pre-push'), 'utf8');
  assert.match(installed, /agent-gate/);
  await rm(root, { recursive: true, force: true });
});
test('archive fallback allows claim when dependency is in archive', () => {
  // T-4821 depends on T-4405, which is in the archive
  const row = {
    id: 'T-4821',
    href: 'tasks/T-4821-location-city.md',
    source: 'backlog/index/m0.md',
    tags: ['backend'],
    status: 'todo',
    line: '| [T-4821] | City | — | backend | middle | todo |'
  };
  
  // Create a temp archive task T-4405 (done)
  const archiveDir = join(tmpdir(), 'backlog', 'tasks', '_archive', '2026', '11');
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.writeFileSync(join(archiveDir, 'T-4405-location-address-map-picker.md'), `# T-4405 · Локація: точна адреса (структурована) + вибір точки на карті в адмінці

- **Stage**: M1 (phase 2, розвиток T-021) · **Tags**: backend, frontend · **Complexity**: middle · **Depends on**: T-021 (done), T-004
- **StoryPoints**: 8

## Done

- [x] All done
`);
  
  const taskTextArchive = (slug) => {
    const archivePath = join(tmpdir(), 'backlog', 'tasks', '_archive', '2026', slug + '.md');
    return existsSync(archivePath) ? readFileSync(archivePath, 'utf8') : '';
  };
  
  const statusById = new Map([
    ['T-4405', 'done'],
    ['T-4821', 'todo'],
  ]);
  
  const text = '- **Tags**: backend\n';
  
  const blocked = claimBlock(row, text, statusById, 'backend', taskTextArchive);
  
  // T-4821 should be claimable because T-4405 is in archive as done
  assert.strictEqual(blocked, null, `Expected null (claimable), got: ${blocked}`);
  
  // Cleanup
  rmSync(archiveDir, { recursive: true, force: true });
});

test('a sources-column reference is not a dependency', () => {
  const text = '# T-4851\n\n- **Tags**: frontend, ux · **Depends on**: T-030, T-4610b\n';
  // T-130 is cited in the index «Джерело» column as an out-of-scope feature.
  assert.deepEqual(dependencyIds(text, 'BarberCard.tsx; T-4610b; T-130'), ['T-030', 'T-4610b']);
});

test('a task that declares no dependency keeps the index fallback', () => {
  assert.deepEqual(dependencyIds('- **Tags**: backend\n', 'backlog/index/m0.md; T-123'), ['T-123']);
});

test('next lists ready rows first and names what blocks the rest', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gate-next-'));
  await mkdir(join(root, 'backlog', 'index'), { recursive: true });
  await mkdir(join(root, 'backlog', 'tasks'), { recursive: true });
  await writeFile(
    join(root, 'backlog', 'index', 'm0.md'),
    [
      '| [T-1](../tasks/T-1-a.md) | A | — | backend | middle | todo |',
      '| [T-2](../tasks/T-2-b.md) | B | — | backend | middle | todo |',
    ].join('\n')
  );
  await writeFile(join(root, 'backlog', 'tasks', 'T-1-a.md'), '- **Tags**: backend · **Depends on**: —\n');
  await writeFile(join(root, 'backlog', 'tasks', 'T-2-b.md'), '- **Tags**: backend · **Depends on**: T-9\n');

  const entries = nextTasks(root, 'backend-developer');
  assert.equal(entries.find((entry) => entry.id === 'T-1').reason, null);
  assert.equal(entries.find((entry) => entry.id === 'T-2').reason, 'T-2 depends on T-9');

  await rm(root, { recursive: true, force: true });
});
