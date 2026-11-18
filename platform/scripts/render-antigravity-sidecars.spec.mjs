import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ensureWorktree, renderSidecars, worktreePath } from './render-antigravity-sidecars.mjs';

test('backend sidecar owns scheduling and not apps/web', () => {
  const rendered = renderSidecars(process.cwd(), { home: '/Users/example' });
  const backend = rendered.find((entry) => entry.id === 'implement-backend');
  const prompt = backend.json.args.at(-1);
  assert.match(prompt, /apps\/api\/src\/scheduling/);
  assert.doesNotMatch(prompt, /apps\/web/);
  assert.equal(backend.json.args[0], 'CRON_TZ=Europe/Kiev 0,15,30,45 * * * *');
  assert.equal(backend.json.args[1], process.execPath);
  assert.match(backend.json.args[2], /implement-backend\/scripts\/agent-preflight\.mjs$/);
  assert.equal(backend.json.args[3], 'implement-backend');
  assert.match(prompt, /Model: Flash Lite/);
  assert.doesNotMatch(prompt, /flash-lite/);
  const frontend = rendered.find((entry) => entry.id === 'implement-frontend');
  const frontendPrompt = frontend.json.args.at(-1);
  assert.match(frontendPrompt, /Except:\n- apps\/web\/src\/lib\/seo/);
  assert.match(frontendPrompt, /apps\/web\/src\/app\/sitemap\.ts/);
  assert.match(prompt, /node scripts\/agent-gate\.mjs/);
  assert.match(
    prompt,
    new RegExp(worktreePath('/Users/example', 'implement-backend').replaceAll('/', '\\/'))
  );
  assert.match(prompt, /git push origin HEAD:stage/);
  assert.doesNotMatch(prompt, /agents\/LOCK/);
  assert.equal(rendered.length, 9);
  assert.equal(backend.json.builtin, 'schedule');
  assert.equal(backend.json.restart_policy, 'always');
});

test('ensureWorktree checks out origin/stage detached', async () => {
  const repo = await mkdtemp(join(tmpdir(), 'agents-repo-'));
  const home = await mkdtemp(join(tmpdir(), 'agents-home-'));
  const git = (...args) =>
    execFileSync('git', ['-C', repo, ...args], {
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'test',
        GIT_AUTHOR_EMAIL: 'test@example.com',
        GIT_COMMITTER_NAME: 'test',
        GIT_COMMITTER_EMAIL: 'test@example.com',
      },
    });
  git('init', '-b', 'stage');
  git('commit', '--allow-empty', '-m', 'init');
  git('update-ref', 'refs/remotes/origin/stage', 'HEAD');
  const dest = worktreePath(home, 'implement-backend');
  assert.equal(ensureWorktree(repo, dest), 'created');
  assert.equal(ensureWorktree(repo, dest), 'exists');
  const head = execFileSync('git', ['-C', dest, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const stage = execFileSync('git', ['-C', repo, 'rev-parse', 'origin/stage'], {
    encoding: 'utf8',
  }).trim();
  assert.equal(head, stage);
  const detached = execFileSync('git', ['-C', dest, 'rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  assert.equal(detached, 'HEAD');
  execFileSync('git', ['-C', repo, 'worktree', 'remove', '--force', dest]);
  await rm(repo, { recursive: true, force: true });
  await rm(home, { recursive: true, force: true });
});
