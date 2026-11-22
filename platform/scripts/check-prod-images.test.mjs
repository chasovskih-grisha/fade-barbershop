import assert from 'node:assert/strict';
import test from 'node:test';

import {
  APPS,
  checkComposeTargets,
  checkProdCommand,
  checkProdDatabaseInit,
  cmdOfStage,
  composeBuilds,
  composeService,
  finalStage,
  stages,
} from './check-prod-images.mjs';

const TWO_MODE = `FROM node:20-alpine AS dev
WORKDIR /app
RUN pnpm install

FROM dev AS build
RUN pnpm --filter @fade/api build

FROM node:20-alpine AS prod
ENV NODE_ENV=production
CMD ["node", "dist/main"]
`;

test('stages lists every named stage in file order', () => {
  assert.deepEqual(stages(TWO_MODE), ['dev', 'build', 'prod']);
});

test('finalStage is the stage a build without target lands on', () => {
  assert.equal(finalStage(TWO_MODE), 'prod');
});

test('cmdOfStage reads the CMD of the requested stage only', () => {
  assert.equal(cmdOfStage(TWO_MODE, 'prod'), '["node", "dist/main"]');
  assert.equal(cmdOfStage(TWO_MODE, 'dev'), undefined);
});

test('composeBuilds pairs each dockerfile with its pinned target', () => {
  const compose = `    build:
      context: ..
      dockerfile: infra/api.Dockerfile
      target: prod
`;
  assert.deepEqual(composeBuilds(compose), [
    { dockerfile: 'infra/api.Dockerfile', target: 'prod' },
  ]);
});

test('checkComposeTargets accepts a target the Dockerfile declares', () => {
  const compose = 'dockerfile: infra/api.Dockerfile\n      target: prod\n';
  assert.deepEqual(
    checkComposeTargets(compose, () => TWO_MODE),
    []
  );
});

test('checkComposeTargets rejects a target the Dockerfile does not declare', () => {
  const compose = 'dockerfile: infra/api.Dockerfile\n      target: production\n';
  const problems = checkComposeTargets(compose, () => TWO_MODE);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /production/);
});

test('checkComposeTargets rejects a Dockerfile the repo does not have', () => {
  const compose = 'dockerfile: infra/ghost.Dockerfile\n      target: prod\n';
  assert.match(checkComposeTargets(compose, () => undefined)[0], /does not exist/);
});

test('checkProdCommand rejects a prod stage that starts a dev watcher', () => {
  const devCmd = TWO_MODE.replace('["node", "dist/main"]', '["pnpm", "run", "dev"]');
  assert.match(checkProdCommand(devCmd, 'api')[0], /dev command/);
});

test('checkProdCommand rejects a prod stage with no CMD at all', () => {
  const noCmd = TWO_MODE.replace('CMD ["node", "dist/main"]\n', '');
  assert.match(checkProdCommand(noCmd, 'api')[0], /no CMD/);
});

test('checkProdCommand accepts a built artefact', () => {
  assert.deepEqual(checkProdCommand(TWO_MODE, 'api'), []);
});

test('the repository ships two-mode images for every app', async () => {
  const fs = await import('node:fs');
  for (const app of APPS) {
    const source = fs.readFileSync(new URL(`../infra/${app}.Dockerfile`, import.meta.url), 'utf8');
    assert.deepEqual(checkProdCommand(source, app), []);
    assert.notEqual(finalStage(source), 'dev', `${app}: dev must not be the last stage`);
  }
});

const PROD_DB = `services:
  db-init:
    image: fade-platform-prod-api
    command: ['sh', '/app/apps/api/scripts/prod-init.sh']
  api:
    depends_on:
      db-init:
        condition: service_completed_successfully
  web:
    image: web
`;

test('composeService reads one top-level service only', () => {
  assert.match(composeService(PROD_DB, 'db-init') ?? '', /prod-init\.sh/);
  assert.doesNotMatch(composeService(PROD_DB, 'db-init') ?? '', /depends_on/);
});

test('checkProdDatabaseInit accepts migrations plus the founder account', () => {
  assert.deepEqual(checkProdDatabaseInit(PROD_DB), []);
});

test('checkProdDatabaseInit rejects a prod stack without db-init', () => {
  const compose = PROD_DB.replace(/  db-init:[\s\S]*?  api:/, '  api:');
  assert.match(checkProdDatabaseInit(compose)[0], /db-init one-shot is missing/);
});

test('checkProdDatabaseInit rejects demo seeds in production', () => {
  const compose = PROD_DB.replace('prod-init.sh', 'prod-init.sh && pnpm seed:dev');
  assert.match(checkProdDatabaseInit(compose)[0], /seed:dev/);
});

test('checkProdDatabaseInit rejects api starting before db-init', () => {
  const compose = PROD_DB.replace(
    '      db-init:\n        condition: service_completed_successfully\n',
    ''
  );
  assert.match(checkProdDatabaseInit(compose)[0], /api must wait/);
});

test('the repository production stack initializes only schema and founder', async () => {
  const fs = await import('node:fs');
  const compose = fs.readFileSync(
    new URL('../infra/docker-compose.prod.yml', import.meta.url),
    'utf8'
  );
  assert.deepEqual(checkProdDatabaseInit(compose), []);
  assert.doesNotMatch(compose, /seed:dev|seed:customers|seed:appointments/);
});
