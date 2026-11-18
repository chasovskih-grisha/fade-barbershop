import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parseFrontmatter } from './validate-agents.mjs';

/** Detached worktree for one automation, outside the human checkout. */
export function worktreePath(home, id) {
  return join(home, '.gemini', 'worktrees', 'fade-barber', 'platform', id);
}

const listMd = (dir) => readdirSync(dir).filter((name) => name.endsWith('.md'));

const bodyAfter = (text) => {
  const end = text.indexOf('\n---', 4);
  return text.slice(end + 4).trim();
};

const asList = (value) => (Array.isArray(value) ? value : []);

const loadSeatPaths = (root, seat) => {
  const dir = join(root, 'agents', 'roles', seat, 'domains');
  let files;
  try {
    files = listMd(dir);
  } catch {
    return { owns: [], except: [] };
  }
  const owns = [];
  const except = [];
  for (const file of files) {
    const domain = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
    owns.push(...asList(domain.owns));
    except.push(...asList(domain.except));
  }
  return { owns, except };
};

const promptFor = (automation, owns, except, body, worktree) => {
  const skills = asList(automation.skills).join(', ');
  const lines = [
    `# ${automation.name}`,
    '',
    `Kind: ${automation.kind}`,
    `Seat: ${automation.seat}`,
    `Skills: ${skills}`,
    `Worktree: ${worktree}`,
    'Detached at origin/stage. Do not create a branch. Do not checkout stage.',
    'Publish with `git push origin HEAD:stage`.',
    'Model: Flash Lite',
    '',
    'Owns:',
    owns.length ? owns.map((path) => `- ${path}`).join('\n') : '- (no product paths)',
  ];
  if (except.length) {
    lines.push('', 'Except:', except.map((path) => `- ${path}`).join('\n'));
  }
  lines.push(
    '',
    body,
    '',
    'Load the listed skills before editing anything. Status changes go through `node scripts/agent-gate.mjs`. Do not edit the backlog index or the journal by hand. One run, one task. The model tier is flash_lite. A shared lock file is not used.'
  );
  return lines.join('\n');
};

/** One Antigravity sidecar object per automation file. */
export function renderSidecars(root, { home = process.env.HOME } = {}) {
  const roles = join(root, 'agents', 'roles');
  const rendered = [];
  for (const seat of readdirSync(roles)) {
    const automations = join(roles, seat, 'automations');
    let files;
    try {
      files = listMd(automations);
    } catch {
      continue;
    }
    const { owns, except } = loadSeatPaths(root, seat);
    for (const file of files) {
      const full = join(automations, file);
      const text = readFileSync(full, 'utf8');
      const automation = parseFrontmatter(text);
      const body = bodyAfter(text);
      const description = body.split('\n').find((line) => line.trim()) ?? automation.name;
      const prompt = promptFor(automation, owns, except, body, worktreePath(home, automation.name));
      rendered.push({
        id: automation.name,
        json: {
          builtin: 'schedule',
          restart_policy: 'always',
          display_name: `FADE — ${automation.name}`,
          description,
          args: [
            `CRON_TZ=Europe/Kiev ${automation.cron}`,
            process.execPath,
            join(worktreePath(home, automation.name), 'scripts', 'agent-preflight.mjs'),
            automation.name,
            prompt,
          ],
        },
      });
    }
  }
  return rendered.sort((a, b) => a.id.localeCompare(b.id));
}

export function writeRendered(root, rendered = renderSidecars(root)) {
  const out = join(root, 'agents', '.rendered');
  for (const entry of rendered) {
    const dir = join(out, entry.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'sidecar.json'), `${JSON.stringify(entry.json, null, 2)}\n`);
  }
  return out;
}

const GRANTS = [
  'command(git status)',
  'command(git diff)',
  'command(git add)',
  'command(git commit)',
  'command(git fetch)',
  'command(git rebase)',
  'command(git reset)',
  'command(git push)',
  'command(npm test)',
  'command(pnpm agents:validate)',
  'command(node scripts/agent-gate.mjs)',
];

const retiredName = (id) => id.startsWith('fade-') || id === 'ade-automation-conductor';

/** Add a detached worktree at origin/stage. A second call leaves an existing worktree in place. */
export function ensureWorktree(repo, dest) {
  if (existsSync(join(dest, '.git'))) return 'exists';
  mkdirSync(join(dest, '..'), { recursive: true });
  const result = spawnSync(
    'git',
    ['-C', repo, 'worktree', 'add', '--detach', dest, 'origin/stage'],
    { encoding: 'utf8' }
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'git worktree add failed').trim());
  }
  return 'created';
}

const writeProjectFolder = (projectPath, projectId, name, uri) => {
  const current = existsSync(projectPath)
    ? JSON.parse(readFileSync(projectPath, 'utf8'))
    : {
        id: projectId,
        name,
        projectResources: { resources: [{ gitFolder: { folderUri: uri } }] },
        permissionGrants: { permissionGrants: {}, v2Migrated: true },
        settings: { artifactReviewMode: 'ARTIFACT_REVIEW_MODE_TURBO' },
        sidecar: { sidecarId: name },
      };
  current.projectResources ??= { resources: [] };
  current.projectResources.resources ??= [];
  const resource = current.projectResources.resources[0] ?? { gitFolder: {} };
  resource.gitFolder ??= {};
  resource.gitFolder.folderUri = uri;
  current.projectResources.resources[0] = resource;
  writeFileSync(projectPath, `${JSON.stringify(current, null, 2)}\n`);
};

function gitHooksDir(repo) {
  const result = spawnSync('git', ['-C', repo, 'rev-parse', '--git-path', 'hooks'], {
    encoding: 'utf8',
  });
  const path = (result.stdout || '').trim();
  if (result.status !== 0 || !path) throw new Error('git hooks path missing');
  return isAbsolute(path) ? path : join(repo, path);
}

/** Copy the versioned pre-push gate into this repo and each automation worktree. */
export function installGateHook(repo, worktrees = []) {
  const body = readFileSync(join(repo, 'hooks', 'pre-push'));
  const dests = [gitHooksDir(repo)];
  for (const tree of worktrees) {
    if (existsSync(join(tree, '.git'))) dests.push(gitHooksDir(tree));
  }
  for (const dir of dests) {
    mkdirSync(dir, { recursive: true });
    const dest = join(dir, 'pre-push');
    writeFileSync(dest, body);
    chmodSync(dest, 0o755);
  }
  return dests;
}

/** Replace live FADE sidecars with the rendered nine. Keeps swarm. Points each project at its worktree. */
export function installSidecars(geminiConfig, rendered, { repo, home } = {}) {
  const configPath = join(geminiConfig, 'config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const backup = join(geminiConfig, 'config.sidecars-backup-2026-11-16.json');
  if (!existsSync(backup)) writeFileSync(backup, readFileSync(configPath));

  const retiredDir = join(geminiConfig, 'sidecars-retired', '2026-11-16');
  mkdirSync(retiredDir, { recursive: true });
  const sidecarsDir = join(geminiConfig, 'sidecars');
  const projectsDir = join(geminiConfig, 'projects');
  const retired = [];

  for (const id of Object.keys(config.sidecars ?? {})) {
    if (!retiredName(id)) continue;
    const from = join(sidecarsDir, id);
    if (existsSync(from)) {
      const dest = join(retiredDir, id);
      if (!existsSync(dest)) renameSync(from, dest);
    }
    delete config.sidecars[id];
    retired.push(id);
  }

  for (const entry of rendered) {
    const existing = config.sidecars[entry.id];
    const projectId = existing?.projectId ?? randomUUID();
    mkdirSync(join(sidecarsDir, entry.id), { recursive: true });
    writeFileSync(
      join(sidecarsDir, entry.id, 'sidecar.json'),
      `${JSON.stringify(entry.json, null, 2)}\n`
    );
    if (repo && home) ensureWorktree(repo, worktreePath(home, entry.id));
    const uri =
      repo && home
        ? pathToFileURL(worktreePath(home, entry.id)).href
        : 'file:///Users/grisha/Projects/barbershop';
    writeProjectFolder(join(projectsDir, `${projectId}.json`), projectId, entry.id, uri);
    const permissions =
      existing && Object.prototype.hasOwnProperty.call(existing, 'resolvedPermissions')
        ? existing.resolvedPermissions
        : { accessGrants: GRANTS };
    config.sidecars[entry.id] = {
      enabled: existing?.enabled ?? true,
      projectId,
      resolvedPermissions: permissions,
      schemaVersion: 1,
    };
  }
  if (repo) {
    const trees = home ? rendered.map((entry) => worktreePath(home, entry.id)) : [];
    installGateHook(repo, trees);
  }

  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return retired.sort();
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const root = process.cwd();
  const home = process.env.HOME;
  const rendered = renderSidecars(root, { home });
  const out = writeRendered(root, rendered);
  console.log(out);
  if (process.argv.includes('--install')) {
    const fetched = spawnSync('git', ['-C', root, 'fetch', 'origin', 'stage'], {
      encoding: 'utf8',
    });
    if (fetched.status !== 0) {
      console.error((fetched.stderr || 'git fetch origin stage failed').trim());
      process.exit(1);
    }
    const retired = installSidecars(join(home, '.gemini', 'config'), rendered, {
      repo: root,
      home,
    });
    console.log(`retired ${retired.length}`);
    for (const id of retired) console.log(`  ${id}`);
  }
}
