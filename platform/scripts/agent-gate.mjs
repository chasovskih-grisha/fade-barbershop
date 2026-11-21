import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseFrontmatter } from './validate-agents.mjs';

export const CRAFT_TAGS = ['backend', 'frontend', 'mobile', 'design', 'seo', 'devops'];

export const SEAT_TAG = {
  'backend-developer': 'backend',
  'frontend-developer': 'frontend',
  'mobile-developer': 'mobile',
  designer: 'design',
  seo: 'seo',
  devops: 'devops',
};

const craftSet = new Set(CRAFT_TAGS);

export function craftTags(tags) {
  return tags.filter((tag) => craftSet.has(tag));
}

export function parseIndexRow(line) {
  if (!line.startsWith('|')) return null;
  const cells = line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
  if (cells.length < 6) return null;
  const id = cells[0].match(/\[(T-[\w-]+)\]\(([^)]+)\)/);
  if (!id) return null;
  return {
    id: id[1],
    href: id[2],
    source: cells[2],
    tags: cells[3]
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    status: cells[5],
    line,
  };
}

export function parseIndex(text) {
  return text.split('\n').map(parseIndexRow).filter(Boolean);
}

export function replaceStatus(line, status) {
  return line.replace(/\|\s*[^|]*\s*\|\s*$/, `| ${status} |`);
}

export function tagsFromTask(text) {
  const line = text.split('\n').find((entry) => /\*\*Tags\*\*/.test(entry));
  if (!line) return [];
  return line
    .split(':')
    .slice(1)
    .join(':')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function dependencyIds(taskText, source) {
  const ids = new Set();
  const header = taskText.match(/\*\*Dependencies\*\*:\s*(.*)/);
  const section = taskText.split(/^## Dependencies\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  const blobs = [header?.[1] ?? '', section, source ?? ''];
  for (const blob of blobs) {
    for (const match of blob.matchAll(/\b(T-\d[\w-]*)/g)) ids.add(match[1]);
  }
  return [...ids];
}

export function combinedTags(row, taskText) {
  return [...new Set([...row.tags, ...tagsFromTask(taskText)])];
}

/** Null when the row can be claimed. Otherwise a short reason. */
export function claimBlock(row, taskText, statusById, seatTag) {
  const tags = combinedTags(row, taskText);
  if (row.status !== 'todo') return `${row.id} is ${row.status}`;
  if (!tags.includes(seatTag)) return `${row.id} is not tagged ${seatTag}`;
  const craft = craftTags(tags);
  if (craft.length !== 1) return `${row.id} has ${craft.length} craft tags`;
  for (const dep of dependencyIds(taskText, row.source)) {
    if (dep === row.id) continue;
    const status = statusById.get(dep);
    if (status !== 'done' && status !== 'split') return `${row.id} depends on ${dep}`;
  }
  return null;
}

const under = (prefix, file) =>
  file === prefix || file.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);

export function isOwned(owns, file) {
  if ((owns.except ?? []).some((prefix) => under(prefix, file))) return false;
  return (owns.owns ?? []).some((prefix) => under(prefix, file));
}

export function sectionBody(text, heading) {
  const parts = text.split(new RegExp(`^## ${heading}\\s*$`, 'm'));
  if (parts.length < 2) return '';
  return parts[1].split(/^## /m)[0];
}

export function parsePlan(text) {
  const body = sectionBody(text, 'Implementation plan');
  const paths = [...body.matchAll(/(?:apps|packages|infra)\/[A-Za-z0-9_./[\]()-]+/g)].map(
    (match) => match[0]
  );
  const checks = body.split(/^Checks:\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  const commands = checks
    .split('\n')
    .map((line) =>
      line
        .replace(/^[-*]\s*/, '')
        .replace(/^`|`$/g, '')
        .trim()
    )
    .filter((line) => line && !line.endsWith(':'));
  return { paths: [...new Set(paths)], commands };
}

export function isTestFile(file) {
  return /\.(?:test|spec)\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file);
}

/** Null when the plan can support a claim. */
export function planProblems(text, owns) {
  const { paths, commands } = parsePlan(text);
  const owned = paths.filter((path) => isOwned(owns, path));
  if (!owned.some((path) => !isTestFile(path))) return 'implementation plan names no owned path';
  const tests = owned.filter((path) => isTestFile(path));
  if (tests.length === 0) return 'implementation plan names no test';
  if (!commands.some((command) => tests.some((path) => command.includes(path)))) {
    return 'implementation plan check does not run the test';
  }
  return null;
}

const commentLine = (line) => {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('<!--')
  );
};

const codeFile = (file) => /\.(ts|tsx|js|mjs|cjs|jsx|sh|sql|prisma|json|css|yml|yaml)$/.test(file);

/** Owned source files whose patch is more than a comment, a blank file, or a one-line stub. */
export function substantialFiles(patches, owns) {
  const hit = [];
  for (const [file, patch] of Object.entries(patches)) {
    if (!isOwned(owns, file) || !codeFile(file)) continue;
    const added = patch
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
      .map((line) => line.slice(1));
    const removed = patch
      .split('\n')
      .filter((line) => line.startsWith('-') && !line.startsWith('---'))
      .map((line) => line.slice(1))
      .filter((line) => line.trim());
    const code = added.filter((line) => line.trim() && !commentLine(line));
    if (code.length < 3) continue;
    if (removed.length > 10 && code.length < 8) continue;
    hit.push(file);
  }
  return hit.sort();
}

export function notesBody(files) {
  return [...files]
    .sort()
    .map((file) => `- ${file}`)
    .join('\n');
}

export function qaBody(commands) {
  return commands.map((command) => `- \`${command}\` exit 0`).join('\n');
}

export function qaPasses(text, commands) {
  if (commands.length === 0) return false;
  const body = sectionBody(text, 'QA');
  return commands.every((command) => body.includes(`- \`${command}\` exit 0`));
}

export function upsertSection(text, heading, body) {
  const block = `## ${heading}\n\n${body.trim()}\n`;
  const pattern = new RegExp(`^## ${heading}\\s*\\n[\\s\\S]*?(?=^## |$)`, 'm');
  if (pattern.test(text)) return text.replace(pattern, `${block}\n`);
  return `${text.trimEnd()}\n\n${block}`;
}

const coversPlan = (file, paths) => paths.some((path) => file === path || under(path, file));

const testCaseLine = (line) => /\b(?:it|test)(?:\.\w+)?\s*\(/.test(line);

export function addedTestCases(patch) {
  return patch
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .filter((line) => line.trim() && !commentLine(line) && testCaseLine(line));
}

/** Reasons a review diff cannot leave `in_progress`. Empty when it can. */
export function reviewGaps(text, patches, owns) {
  const substantial = substantialFiles(patches, owns);
  if (substantial.length === 0) return ['review diff is not an implementation'];
  const gaps = [];
  const problem = planProblems(text, owns);
  if (problem) gaps.push(problem);
  const planned = parsePlan(text).paths;
  const product = substantial.filter((file) => !isTestFile(file));
  if (!product.some((file) => coversPlan(file, planned))) {
    gaps.push('review does not touch a path from the implementation plan');
  }
  const tests = substantial.filter((file) => isTestFile(file) && coversPlan(file, planned));
  if (!tests.some((file) => addedTestCases(patches[file] ?? '').length > 0)) {
    gaps.push('review does not add a test from the implementation plan');
  }
  return gaps;
}

const STATUS_FROM = {
  in_progress: new Set(['todo']),
  review: new Set(['in_progress']),
  qa: new Set(['review']),
  done: new Set(['qa']),
};

export function reviewJournalLine(taskId, files) {
  const list = [...files].sort().join(', ') || '(none)';
  return `- **${taskId}** → review. Product files: ${list}.`;
}

export function doneJournalLine(taskId, commands) {
  return `- **${taskId}** → done. Checks: ${commands.join('; ')} exit 0.`;
}

export function withdrawJournalLine(taskId) {
  return `- **${taskId}** → todo. Review withdrawn: the diff had no file under the owning seat.`;
}

export function insertJournal(text, line) {
  if (text.includes(line)) return text;
  const lines = text.split('\n');
  const index = lines.findIndex((entry) => entry.startsWith('- '));
  if (index === -1) return `${text.trimEnd()}\n\n${line}\n`;
  lines.splice(index, 0, line, '');
  return lines.join('\n');
}

export function assessRange({
  changes,
  files,
  patches = {},
  taskTexts = {},
  ownsByTag,
  beforeRows = [],
  afterRows = [],
  publishedQa = new Set(),
}) {
  const errors = [];
  if (files.includes('agents/LOCK')) errors.push('agents/LOCK is not used');
  const product = files.filter(
    (file) => !file.startsWith('backlog/') && !file.startsWith('agents/')
  );
  for (const change of changes) {
    const allowed = STATUS_FROM[change.to];
    if (allowed && !allowed.has(change.from)) {
      errors.push(`${change.id} cannot move from ${change.from || 'untracked'} to ${change.to}`);
      continue;
    }
    const craft = craftTags(change.tags ?? []);
    const text = taskTexts[change.id] ?? change.taskText ?? '';
    if (change.to === 'in_progress') {
      if (craft.length !== 1) {
        errors.push(`${change.id} has ${craft.length} craft tags`);
        continue;
      }
      const problem = planProblems(text, ownsByTag[craft[0]] ?? { owns: [], except: [] });
      if (problem) errors.push(`${change.id} ${problem}`);
      // Baseline rows already in progress are grandfathered: the rule guards
      // against opening a second task, not against the backlog's legacy state.
      const wasOpen = new Set(
        beforeRows.filter((row) => row.status === 'in_progress').map((row) => row.id)
      );
      const open = afterRows.filter(
        (row) =>
          row.status === 'in_progress' && row.tags?.includes(craft[0]) && !wasOpen.has(row.id)
      );
      if (open.length > 1) errors.push(`${change.id} seat already has an in_progress task`);
    }
    if (change.to === 'review') {
      if (craft.length !== 1) {
        errors.push(`${change.id} has ${craft.length} craft tags`);
        continue;
      }
      const owns = ownsByTag[craft[0]] ?? { owns: [], except: [] };
      const outside = product.filter((file) => !isOwned(owns, file));
      if (outside.length) errors.push(`${change.id} review touches ${outside[0]}`);
      const substantial = substantialFiles(patches, owns);
      for (const gap of reviewGaps(text, patches, owns)) errors.push(`${change.id} ${gap}`);
      if (
        substantial.length > 0 &&
        sectionBody(text, 'Implementation notes').trim() !== notesBody(substantial)
      ) {
        errors.push(`${change.id} implementation notes must list the files in the diff`);
      }
    }
    if (change.to === 'qa') {
      const extra = files.filter(
        (file) => !file.startsWith('backlog/tasks/') && !file.startsWith('backlog/index/')
      );
      if (extra.length) errors.push(`${change.id} qa commit changes ${extra[0]}`);
      const commands = parsePlan(text).commands;
      if (!qaPasses(text, commands))
        errors.push(`${change.id} QA section must record exit 0 for each plan check`);
    }
    if (change.to === 'done') {
      const commands = parsePlan(text).commands;
      if (!qaPasses(text, commands)) errors.push(`${change.id} done without a QA record`);
      if (!publishedQa.has(change.id))
        errors.push(`${change.id} qa commit is not on origin/stage yet`);
      const reviewed = changes.some((entry) => entry.id === change.id && entry.to === 'review');
      if (product.length && !reviewed)
        errors.push(`${change.id} done commit changes product files`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function statusChanges(beforeRows, afterRows) {
  const before = new Map(beforeRows.map((row) => [row.id, row]));
  const changes = [];
  for (const row of afterRows) {
    const previous = before.get(row.id);
    if ((previous?.status ?? '') === row.status) continue;
    changes.push({ id: row.id, from: previous?.status ?? '', to: row.status, tags: row.tags });
  }
  return changes;
}

export function loadOwns(root) {
  const roles = join(root, 'agents', 'roles');
  const byTag = {};
  if (!existsSync(roles)) return byTag;
  for (const seat of readdirSync(roles)) {
    const dir = join(roles, seat, 'domains');
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
      const domain = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
      if (!domain.tag) continue;
      const bucket = byTag[domain.tag] ?? { owns: [], except: [] };
      bucket.owns.push(...(Array.isArray(domain.owns) ? domain.owns : []));
      bucket.except.push(...(Array.isArray(domain.except) ? domain.except : []));
      byTag[domain.tag] = bucket;
    }
  }
  return byTag;
}

const listMd = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).filter((name) => name.endsWith('.md') && statSync(join(dir, name)).isFile())
    : [];

function indexFiles(root) {
  return listMd(join(root, 'backlog', 'index')).sort((a, b) => {
    const left = Number(a.match(/^m(\d+)\.md$/)?.[1] ?? 1000);
    const right = Number(b.match(/^m(\d+)\.md$/)?.[1] ?? 1000);
    return left - right || a.localeCompare(b);
  });
}

export function loadRows(root) {
  const rows = [];
  for (const file of indexFiles(root)) {
    const text = readFileSync(join(root, 'backlog', 'index', file), 'utf8');
    for (const row of parseIndex(text)) rows.push({ ...row, file });
  }
  return rows;
}

function taskText(root, row) {
  const name = row.href.split('/').pop();
  const path = join(root, 'backlog', 'tasks', name);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

export function readyTodos(root, seat) {
  const seatTag = SEAT_TAG[seat];
  if (!seatTag) throw new Error(`unknown seat ${seat}`);
  const rows = loadRows(root);
  const statusById = new Map(rows.map((row) => [row.id, row.status]));
  const ready = [];
  for (const row of rows) {
    const text = taskText(root, row);
    if (!claimBlock(row, text, statusById, seatTag)) ready.push(row);
  }
  return ready;
}

function patchFor(root, file) {
  const tracked = git(root, ['diff', 'origin/stage', '--', file], { allowFail: true });
  if ((tracked.stdout || '').match(/^[-+]/m)) return tracked.stdout;
  const untracked = git(root, ['diff', '--no-index', '--', '/dev/null', file], { allowFail: true });
  return untracked.stdout || '';
}

function git(root, args, { allowFail = false } = {}) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (result.status !== 0 && !allowFail) {
    throw new Error((result.stderr || result.stdout || `git ${args[0]} failed`).trim());
  }
  return result;
}

function journalFile(root, date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return join(root, 'backlog', 'journal', `${date.getFullYear()}-${month}.md`);
}

function writeStatus(root, row, status) {
  const path = join(root, 'backlog', 'index', row.file);
  const text = readFileSync(path, 'utf8');
  const next = text
    .split('\n')
    .map((line) => {
      const parsed = parseIndexRow(line);
      return parsed?.id === row.id ? replaceStatus(line, status) : line;
    })
    .join('\n');
  writeFileSync(path, next);
  return path;
}

function appendJournal(root, line) {
  const path = journalFile(root);
  const text = existsSync(path) ? readFileSync(path, 'utf8') : '# Journal\n\n';
  writeFileSync(path, insertJournal(text, line));
  return path;
}

function commit(root, files, message, push) {
  git(root, ['add', '--', ...files]);
  git(root, ['commit', '-m', message]);
  if (push) publish(root);
}

export function publish(root) {
  const ancestor = git(root, ['merge-base', '--is-ancestor', 'origin/stage', 'HEAD'], {
    allowFail: true,
  });
  if (ancestor.status !== 0) {
    const rebase = git(root, ['rebase', 'origin/stage'], { allowFail: true });
    if (rebase.status !== 0) {
      git(root, ['rebase', '--abort'], { allowFail: true });
      throw new Error((rebase.stderr || 'rebase failed').trim());
    }
  }
  const pushed = git(root, ['push', 'origin', 'HEAD:stage'], { allowFail: true });
  if (pushed.status !== 0) throw new Error((pushed.stderr || 'push rejected').trim());
}

function dirtyPaths(root) {
  return git(root, ['status', '--porcelain', '-uall'])
    .stdout.split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}

function changedSinceOrigin(root) {
  const result = git(root, ['diff', '--name-only', 'origin/stage'], { allowFail: true });
  if (result.status !== 0) return [];
  return result.stdout.split('\n').filter(Boolean);
}

function showText(root, rev, path) {
  const result = git(root, ['show', `${rev}:${path}`], { allowFail: true });
  return result.status === 0 ? result.stdout : '';
}

function catBatch(root, specs) {
  const result = spawnSync('git', ['-C', root, 'cat-file', '--batch'], {
    input: Buffer.from(`${specs.join('\n')}\n`),
    maxBuffer: 64 * 1024 * 1024,
  });
  const bodies = new Map();
  const buf = result.stdout ?? Buffer.alloc(0);
  let offset = 0;
  let index = 0;
  while (offset < buf.length && index < specs.length) {
    const newline = buf.indexOf(0x0a, offset);
    const header = buf.slice(offset, newline).toString();
    if (header.endsWith('missing')) {
      bodies.set(specs[index], '');
      offset = newline + 1;
      index += 1;
      continue;
    }
    const size = Number(header.split(' ')[2]);
    const start = newline + 1;
    bodies.set(specs[index], buf.slice(start, start + size).toString('utf8'));
    offset = start + size + 1;
    index += 1;
  }
  return bodies;
}

/** Review rows whose introducing commit range has no file under the owning seat. */
export function classifyOpenReviews(root) {
  const reviews = loadRows(root).filter((row) => row.status === 'review');
  const ownsByTag = loadOwns(root);
  const byFile = new Map();
  for (const row of reviews) {
    const group = byFile.get(row.file) ?? [];
    group.push(row);
    byFile.set(row.file, group);
  }
  const statusOnly = [];
  const real = [];
  for (const [file, group] of byFile) {
    const log = git(
      root,
      ['log', '--format=%H', '-n', '200', 'HEAD', '--', `backlog/index/${file}`],
      {
        allowFail: true,
      }
    );
    const shas = log.status === 0 ? log.stdout.split('\n').filter(Boolean) : [];
    const specs = shas.flatMap((sha) => [
      `${sha}:backlog/index/${file}`,
      `${sha}^:backlog/index/${file}`,
    ]);
    const bodies = specs.length ? catBatch(root, specs) : new Map();
    const parsed = (spec) => parseIndex(bodies.get(spec) ?? '');
    for (const row of group) {
      const tags = combinedTags(row, taskText(root, row));
      const craft = craftTags(tags);
      let review = null;
      let claim = null;
      for (const sha of shas) {
        const current = parsed(`${sha}:backlog/index/${file}`).find((entry) => entry.id === row.id);
        const previous = parsed(`${sha}^:backlog/index/${file}`).find(
          (entry) => entry.id === row.id
        );
        if (!review && current?.status === 'review' && previous?.status !== 'review') review = sha;
        if (review && current?.status === 'in_progress' && previous?.status !== 'in_progress') {
          claim = sha;
          break;
        }
      }
      if (!review) {
        real.push(row.id);
        continue;
      }
      const from = claim ? `${claim}^` : `${review}^`;
      const diff = git(root, ['diff', '--name-only', from, review], { allowFail: true });
      const names = diff.status === 0 ? diff.stdout.split('\n').filter(Boolean) : [];
      const product = names.filter(
        (path) => !path.startsWith('backlog/') && !path.startsWith('agents/')
      );
      const owns = {
        owns: craft.flatMap((tag) => ownsByTag[tag]?.owns ?? []),
        except: craft.flatMap((tag) => ownsByTag[tag]?.except ?? []),
      };
      const hit = craft.length === 1 ? product.filter((path) => isOwned(owns, path)) : product;
      if (hit.length) real.push(row.id);
      else statusOnly.push(row.id);
    }
  }
  return { statusOnly, real };
}

/** Owned files in the commit that set review. `found` is false when that commit is outside the search. */
export function filesCoveringReview(root, taskId, owns, tip = 'HEAD') {
  const listing = git(root, ['ls-tree', '-r', '--name-only', tip, '--', 'backlog/index'], {
    allowFail: true,
  });
  if (listing.status !== 0) return { found: false, review: null, files: [] };
  const file = listing.stdout
    .split('\n')
    .find((path) => showText(root, tip, path).includes(`[${taskId}]`));
  if (!file) return { found: false, review: null, files: [] };
  const log = git(root, ['log', '--format=%H', '-n', '400', tip, '--', file], { allowFail: true });
  if (log.status !== 0) return { found: false, review: null, files: [] };
  let review = null;
  let claim = null;
  for (const sha of log.stdout.split('\n').filter(Boolean)) {
    const current = parseIndex(showText(root, sha, file)).find((row) => row.id === taskId);
    const parent = git(root, ['rev-parse', '--verify', `${sha}^`], { allowFail: true });
    const previous =
      parent.status === 0
        ? parseIndex(showText(root, parent.stdout.trim(), file)).find((row) => row.id === taskId)
        : null;
    if (!review && current?.status === 'review' && previous?.status !== 'review') review = sha;
    if (review && current?.status === 'in_progress' && previous?.status !== 'in_progress') {
      claim = sha;
      break;
    }
  }
  if (!review) return { found: false, review: null, files: [] };
  const from = claim ? `${claim}^` : `${review}^`;
  const diff = git(root, ['diff', '--name-only', from, review], { allowFail: true });
  const names = diff.status === 0 ? diff.stdout.split('\n').filter(Boolean) : [];
  return { found: true, review, files: names.filter((path) => isOwned(owns, path)) };
}

/** True when `tip` already contains the commit that moved this task from review to qa. */
export function qaIsPublished(root, taskId, tip) {
  if (!tip) return false;
  const listed = git(root, ['rev-parse', '--verify', `${tip}^{commit}`], { allowFail: true });
  if (listed.status !== 0) return false;
  const listing = git(root, ['ls-tree', '-r', '--name-only', tip, '--', 'backlog/index'], {
    allowFail: true,
  });
  if (listing.status !== 0) return false;
  const file = listing.stdout
    .split('\n')
    .find((path) => showText(root, tip, path).includes(`[${taskId}]`));
  if (!file) return false;
  const log = git(root, ['log', '--format=%H', '-n', '400', tip, '--', file], { allowFail: true });
  if (log.status !== 0) return false;
  for (const sha of log.stdout.split('\n').filter(Boolean)) {
    const current = parseIndex(showText(root, sha, file)).find((row) => row.id === taskId);
    const parent = git(root, ['rev-parse', '--verify', `${sha}^`], { allowFail: true });
    const previous =
      parent.status === 0
        ? parseIndex(showText(root, parent.stdout.trim(), file)).find((row) => row.id === taskId)
        : null;
    if (current?.status === 'qa' && previous?.status === 'review') return true;
  }
  return false;
}

function rangeSnapshot(root, from, to) {
  const names = git(root, ['diff', '--name-only', from, to]).stdout.split('\n').filter(Boolean);
  const journalDiff = git(root, ['diff', '-U0', from, to, '--', 'backlog/journal'], {
    allowFail: true,
  });
  const journalAdded = (journalDiff.stdout || '')
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1));
  const indexList = git(root, ['ls-tree', '-r', '--name-only', to, '--', 'backlog/index'])
    .stdout.split('\n')
    .filter((path) => path.endsWith('.md'));
  const before = [];
  const after = [];
  for (const file of indexList) {
    for (const row of parseIndex(showText(root, from, file))) before.push(row);
    for (const row of parseIndex(showText(root, to, file))) after.push(row);
  }
  const changes = statusChanges(before, after);
  const taskTexts = {};
  for (const change of changes) {
    const row = after.find((entry) => entry.id === change.id);
    if (!row) continue;
    const task = showText(root, to, `backlog/tasks/${row.href.split('/').pop()}`);
    change.tags = combinedTags(row, task);
    taskTexts[change.id] = task;
  }
  const patches = {};
  for (const file of names) {
    if (file.startsWith('backlog/') || file.startsWith('agents/')) continue;
    const diff = git(root, ['diff', from, to, '--', file], { allowFail: true });
    patches[file] = diff.stdout || '';
  }
  return { names, journalAdded, changes, taskTexts, patches, before, after };
}

export function verifyRange(root, from, to) {
  const list = git(root, ['rev-list', '--reverse', `${from}..${to}`], { allowFail: true });
  if (list.status !== 0) throw new Error((list.stderr || 'rev-list failed').trim());
  const ownsByTag = loadOwns(root);
  const errors = [];
  let previous = from;
  for (const sha of list.stdout.split('\n').filter(Boolean)) {
    const snap = rangeSnapshot(root, previous, sha);
    const publishedQa = new Set(
      snap.changes
        .filter((change) => change.to === 'done' && qaIsPublished(root, change.id, from))
        .map((change) => change.id)
    );
    const result = assessRange({
      changes: snap.changes,
      files: snap.names,
      patches: snap.patches,
      taskTexts: snap.taskTexts,
      ownsByTag,
      beforeRows: snap.before,
      afterRows: snap.after,
      publishedQa,
    });
    errors.push(...result.errors);
    previous = sha;
  }
  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

function fail(errors) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

function rowById(root, id) {
  const row = loadRows(root).find((entry) => entry.id === id);
  if (!row) throw new Error(`no index row ${id}`);
  return row;
}

function taskRel(row) {
  return `backlog/tasks/${row.href.split('/').pop()}`;
}

function writeTask(root, row, text) {
  const path = join(root, taskRel(row));
  writeFileSync(path, text.endsWith('\n') ? text : `${text}\n`);
  return path;
}

export function claimTask(root, seat, { push = true } = {}) {
  const seatTag = SEAT_TAG[seat];
  if (!seatTag) throw new Error(`unknown seat ${seat}`);
  const ready = readyTodos(root, seat);
  if (ready.length === 0) {
    console.log('none');
    return null;
  }
  const row = ready[0];
  const open = loadRows(root).filter(
    (entry) => entry.status === 'in_progress' && entry.tags.includes(seatTag)
  );
  if (open.length > 0) throw new Error(`this seat already has ${open[0].id} in progress`);
  const dirty = dirtyPaths(root).filter((file) => file !== taskRel(row));
  if (dirty.length) throw new Error('worktree is dirty');
  const problem = planProblems(
    taskText(root, row),
    loadOwns(root)[seatTag] ?? { owns: [], except: [] }
  );
  if (problem) throw new Error(`${row.id} ${problem}`);
  const indexPath = writeStatus(root, row, 'in_progress');
  commit(root, [indexPath, join(root, taskRel(row))], `claim: ${row.id}`, push);
  console.log(row.id);
  return row.id;
}

export function reviewTask(root, seat, taskId, { push = true } = {}) {
  const seatTag = SEAT_TAG[seat];
  if (!seatTag) throw new Error(`unknown seat ${seat}`);
  const row = rowById(root, taskId);
  const tags = combinedTags(row, taskText(root, row));
  if (row.status !== 'in_progress') throw new Error(`${taskId} is ${row.status}`);
  if (!tags.includes(seatTag)) throw new Error(`${taskId} is not tagged ${seatTag}`);
  const craft = craftTags(tags);
  if (craft.length !== 1) throw new Error(`${taskId} has ${craft.length} craft tags`);
  const owns = loadOwns(root)[craft[0]] ?? { owns: [], except: [] };
  const files = [...new Set([...changedSinceOrigin(root), ...dirtyPaths(root)])];
  const outside = files.filter((file) => !file.startsWith('backlog/') && !isOwned(owns, file));
  if (outside.length) throw new Error(`${taskId} review touches ${outside[0]}`);
  const patches = {};
  for (const file of files) {
    if (file.startsWith('backlog/') || file.startsWith('agents/')) continue;
    patches[file] = patchFor(root, file);
  }
  const substantial = substantialFiles(patches, owns);
  const gap = reviewGaps(taskText(root, row), patches, owns)[0];
  if (gap) throw new Error(`${taskId} ${gap}`);
  const taskPath = writeTask(
    root,
    row,
    upsertSection(taskText(root, row), 'Implementation notes', notesBody(substantial))
  );
  const indexPath = writeStatus(root, row, 'review');
  const journal = appendJournal(root, reviewJournalLine(taskId, substantial));
  commit(root, [...substantial, taskPath, indexPath, journal], `review: ${taskId}`, push);
  console.log(taskId);
  return taskId;
}

function runCheck(root, command) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_WORKER_ID;
  return spawnSync(command, { shell: true, cwd: root, encoding: 'utf8', env });
}

/** True when `command` fails after product files are restored to the parent of the review commit. */
export function failsWithoutProduct(root, review, files, command) {
  const saved = new Map();
  for (const file of files) {
    const path = join(root, file);
    saved.set(file, existsSync(path) ? readFileSync(path) : null);
    const parent = git(root, ['show', `${review}^:${file}`], { allowFail: true });
    if (parent.status !== 0) {
      if (existsSync(path)) unlinkSync(path);
    } else writeFileSync(path, parent.stdout);
  }
  try {
    return runCheck(root, command).status !== 0;
  } finally {
    for (const [file, content] of saved) {
      const path = join(root, file);
      if (content === null) {
        if (existsSync(path)) unlinkSync(path);
      } else writeFileSync(path, content);
    }
  }
}

export function qaTask(root, taskId, { push = true } = {}) {
  const row = rowById(root, taskId);
  if (row.status !== 'review') throw new Error(`${taskId} is ${row.status}`);
  const text = taskText(root, row);
  const commands = parsePlan(text).commands;
  if (commands.length === 0) throw new Error(`${taskId} implementation plan names no check`);
  const tags = combinedTags(row, text);
  const craft = craftTags(tags);
  if (craft.length !== 1) throw new Error(`${taskId} has ${craft.length} craft tags`);
  const owns = loadOwns(root)[craft[0]] ?? { owns: [], except: [] };
  const evidence = filesCoveringReview(root, taskId, owns);
  if (!evidence.found || !evidence.review) throw new Error(`${taskId} review commit was not found`);
  const product = evidence.files.filter((file) => !isTestFile(file));
  const tests = evidence.files.filter((file) => isTestFile(file));
  const proving = commands.filter((command) => tests.some((file) => command.includes(file)));
  if (product.length === 0 || proving.length === 0) {
    throw new Error(`${taskId} review does not add a test from the implementation plan`);
  }
  for (const command of commands) {
    const result = runCheck(root, command);
    if (result.status !== 0) throw new Error(`${command} exited ${result.status ?? 1}`);
  }
  for (const command of proving) {
    if (!failsWithoutProduct(root, evidence.review, product, command)) {
      throw new Error(`${command} still passes without the product diff`);
    }
  }
  const taskPath = writeTask(root, row, upsertSection(text, 'QA', qaBody(commands)));
  const indexPath = writeStatus(root, row, 'qa');
  commit(root, [taskPath, indexPath], `qa: ${taskId}`, push);
  console.log(taskId);
  return taskId;
}

export function doneTask(root, taskId, { push = true } = {}) {
  const row = rowById(root, taskId);
  if (row.status !== 'qa') throw new Error(`${taskId} is ${row.status}`);
  const text = taskText(root, row);
  if (!qaPasses(text, parsePlan(text).commands))
    throw new Error(`${taskId} done without a QA record`);
  const recorded = existsSync(join(root, '.agent-run'))
    ? readFileSync(join(root, '.agent-run'), 'utf8').trim()
    : '';
  if (!qaIsPublished(root, taskId, recorded))
    throw new Error(`${taskId} qa commit is not on origin/stage yet`);
  const product = dirtyPaths(root).filter(
    (file) => file !== '.agent-run' && !file.startsWith('backlog/') && !file.startsWith('agents/')
  );
  if (product.length) throw new Error(`${taskId} done commit changes product files`);
  const indexPath = writeStatus(root, row, 'done');
  commit(root, [indexPath], `done: ${taskId}`, push);
  console.log(taskId);
  return taskId;
}

export function acceptTask(root, taskId, commands, { push = true } = {}) {
  if (commands.length === 0) {
    console.log('left in review');
    return null;
  }
  const row = rowById(root, taskId);
  if (row.status !== 'review') throw new Error(`${taskId} is ${row.status}`);
  const tags = combinedTags(row, taskText(root, row));
  const craft = craftTags(tags);
  if (craft.length !== 1) throw new Error(`${taskId} has ${craft.length} craft tags`);
  const owns = loadOwns(root)[craft[0]] ?? { owns: [], except: [] };
  const prior = filesCoveringReview(root, taskId, owns);
  const evidence = [
    ...changedSinceOrigin(root).filter((file) => isOwned(owns, file)),
    ...prior.files,
  ];
  if (evidence.length === 0) throw new Error(`${taskId} done without a product review`);
  for (const command of commands) {
    const result = spawnSync(command, { shell: true, cwd: root, encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(`${command} exited ${result.status ?? 1}`);
    }
  }
  const indexPath = writeStatus(root, row, 'done');
  const journal = appendJournal(root, doneJournalLine(taskId, commands));
  commit(root, [indexPath, journal], `accept: ${taskId}`, push);
  console.log(taskId);
  return taskId;
}

export function withdrawTask(root, taskId, { push = true } = {}) {
  const row = rowById(root, taskId);
  if (row.status !== 'review') throw new Error(`${taskId} is ${row.status}`);
  const tags = combinedTags(row, taskText(root, row));
  const craft = craftTags(tags);
  const owns =
    craft.length === 1
      ? (loadOwns(root)[craft[0]] ?? { owns: [], except: [] })
      : { owns: [], except: [] };
  const evidence = filesCoveringReview(root, taskId, owns);
  if (craft.length === 1 && !evidence.found)
    throw new Error(`${taskId} review commit was not found`);
  if (craft.length === 1 && evidence.files.length > 0) {
    throw new Error(`${taskId} review has product files`);
  }
  const indexPath = writeStatus(root, row, 'todo');
  const journal = appendJournal(root, withdrawJournalLine(taskId));
  commit(root, [indexPath, journal], `withdraw: ${taskId}`, push);
  console.log(taskId);
  return taskId;
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const root = process.cwd();
  const push = !process.argv.includes('--no-push');
  const command = process.argv[2];
  try {
    if (command === 'claim') claimTask(root, flag(process.argv, '--seat'), { push });
    else if (command === 'review') {
      reviewTask(root, flag(process.argv, '--seat'), flag(process.argv, '--task'), { push });
    } else if (command === 'qa') qaTask(root, flag(process.argv, '--task'), { push });
    else if (command === 'done') doneTask(root, flag(process.argv, '--task'), { push });
    else if (command === 'withdraw') withdrawTask(root, flag(process.argv, '--task'), { push });
    else if (command === 'verify-range') {
      const result = verifyRange(root, flag(process.argv, '--from'), flag(process.argv, '--to'));
      if (!result.ok) fail(result.errors);
    } else {
      throw new Error('use claim, review, qa, done, withdraw, or verify-range');
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
