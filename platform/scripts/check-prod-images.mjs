#!/usr/bin/env node
// T-4614a · Gate for the production images of api, web and admin.
//
// Each app ships one Dockerfile with two modes: the unnamed first stage is the
// dev recipe (ADR 0018), `prod` is the image the VPS runs (ADR 0051). The risk
// this gate covers: a compose file that names a Dockerfile without `target:`
// takes whatever the file ends with — the VPS would silently run the dev recipe,
// or the local stack would silently try to start a production build.
//
// Run: `pnpm images:check`. Tests: `pnpm images:test`.
// Output: `file: message`, exit 1 on any violation.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const APPS = ['api', 'web', 'admin'];

export const COMPOSE = {
  dev: 'infra/docker-compose.yml',
  prod: 'infra/docker-compose.prod.yml',
};

/** Top-level compose service body (stops at the next two-space service). */
export function composeService(compose, name) {
  const start = compose.search(new RegExp(`^  ${name}:`, 'm'));
  if (start < 0) return undefined;
  return compose.slice(start).split(/\n(?=  [A-Za-z0-9_-]+:\s*$)/m)[0];
}

/**
 * T-4614b: production starts from migrations and the founder account only.
 * Dev/e2e seeds must not reappear in the prod stack, and api must wait for
 * the init one-shot so it never serves a migrated-but-adminless database.
 */
export function checkProdDatabaseInit(compose) {
  const problems = [];
  const init = composeService(compose, 'db-init');
  if (!init) {
    problems.push('prod compose: db-init one-shot is missing');
  } else {
    if (!/prod-init\.sh/.test(init)) {
      problems.push('prod compose: db-init must run apps/api/scripts/prod-init.sh');
    }
    for (const seed of ['seed:dev', 'seed:customers', 'seed:appointments']) {
      if (init.includes(seed)) problems.push(`prod compose: db-init must not run ${seed}`);
    }
  }

  const api = composeService(compose, 'api');
  if (!api || !/db-init:\s*\n\s+condition:\s+service_completed_successfully/.test(api)) {
    problems.push('prod compose: api must wait for db-init service_completed_successfully');
  }
  return problems;
}

/** Stage names of a Dockerfile, in file order. */
export function stages(dockerfile) {
  return [...dockerfile.matchAll(/^FROM\s+\S+\s+AS\s+(\S+)/gm)].map((m) => m[1]);
}

/** The stage a build would land on when it names no `target`. */
export function finalStage(dockerfile) {
  const all = stages(dockerfile);
  return all[all.length - 1];
}

/** Body of the stage called `name`, or undefined when there is no such stage. */
export function stageBody(dockerfile, name) {
  const chunks = dockerfile.split(/^FROM\s/m).slice(1);
  const chunk = chunks.find((c) =>
    new RegExp(`^\\S+\\s+AS\\s+${name}\\s*$`, 'm').test(c.split('\n')[0])
  );
  return chunk;
}

/** `CMD` of the stage called `name`, or undefined when that stage sets none. */
export function cmdOfStage(dockerfile, name) {
  const body = stageBody(dockerfile, name);
  const m = body && /^CMD\s+(.+)$/m.exec(body);
  return m ? m[1].trim() : undefined;
}

/** Per-service `dockerfile:` / `target:` pairs from a compose file. */
export function composeBuilds(compose) {
  return [...compose.matchAll(/dockerfile:\s*(\S+)\s*\n\s*target:\s*(\S+)/g)].map((m) => ({
    dockerfile: m[1],
    target: m[2],
  }));
}

/** Every build in `compose` must pin a target stage that its Dockerfile declares. */
export function checkComposeTargets(compose, readDockerfile) {
  const problems = [];
  for (const { dockerfile, target } of composeBuilds(compose)) {
    const source = readDockerfile(dockerfile);
    if (source === undefined) {
      problems.push(`${dockerfile}: compose names a Dockerfile that does not exist`);
    } else if (!stages(source).includes(target)) {
      problems.push(
        `${dockerfile}: compose targets «${target}», declared stages: ${stages(source).join(', ')}`
      );
    }
  }
  return problems;
}

/** A production image must start the built artefact, never a dev watcher. */
export function checkProdCommand(dockerfile, app) {
  const cmd = cmdOfStage(dockerfile, 'prod');
  if (!cmd) return [`${app}.Dockerfile: prod stage sets no CMD — compose would have to guess`];
  if (/\bdev\b|--watch/.test(cmd))
    return [`${app}.Dockerfile: prod CMD runs a dev command: ${cmd}`];
  return [];
}

function main() {
  const read = (relative) => {
    const file = path.join(ROOT, relative);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined;
  };
  const problems = [];
  for (const [mode, composePath] of Object.entries(COMPOSE)) {
    const compose = read(composePath);
    if (compose === undefined) {
      problems.push(`${composePath}: missing`);
      continue;
    }
    for (const problem of checkComposeTargets(compose, (d) => read(d)))
      problems.push(`${mode}: ${problem}`);
    if (mode === 'prod') {
      for (const problem of checkProdDatabaseInit(compose)) problems.push(problem);
    }
  }
  for (const app of APPS) {
    const dockerfile = read(`infra/${app}.Dockerfile`);
    if (dockerfile === undefined) {
      problems.push(`infra/${app}.Dockerfile: missing`);
      continue;
    }
    if (finalStage(dockerfile) === 'dev') {
      problems.push(
        `infra/${app}.Dockerfile: dev recipe is the last stage — a build without target would ship it`
      );
    }
    problems.push(...checkProdCommand(dockerfile, app));
  }
  for (const problem of problems) console.error(`infra: ${problem}`);
  process.exit(problems.length === 0 ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
