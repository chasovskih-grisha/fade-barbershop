// Життєвий цикл docker-стейджу для fresh-bootstrap e2e: підйом, очікування
// postgres, запуск сіду. Запити до БД — у fresh-bootstrap.docker.ts.
import { execFileSync } from 'child_process';
import { setTimeout } from 'timers/promises';
import { join } from 'path';
import { dockerExec, pgIsReady } from './fresh-bootstrap.docker';

// __dirname = apps/api/src/e2e → два рівні вгору до кореня пакета api.
// Попереднє `../../../apps/api` розв'язувалось у platform/apps/apps/api
// (не існує): execFileSync кидав spawnSync ENOENT, бо cwd не знайдено.
const API_ROOT = join(__dirname, '../..');

/** Повне перезапущення стейджу: down -v, потім up -d --wait. */
export function resetStack(): void {
  dockerExec(['down', '-v']);
  // --profile — глобальний прапорець compose: він має йти ДО підкоманди
  // (як у Makefile), інакше `up` кидає "unknown flag: --profile".
  dockerExec([
    '--profile',
    'deps',
    '--profile',
    'apps',
    'up',
    '-d',
    '--wait',
    '--wait-timeout',
    '180',
  ]);
}

/** Очікує pg_isready (healthcheck postgres) або кидає помилку за timeout. */
export async function waitForPgReady(timeoutMs = 180_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      pgIsReady();
      return;
    } catch {
      await setTimeout(2000);
    }
  }
  throw new Error('[fresh-bootstrap] postgres never became ready (pg_isready)');
}

/**
 * Запускає `pnpm seed:e2e` у корені api з e2e-оточенням:
 * FADE_SEED_FIXED_IDS — стабільні ідентифікатори для тверджень,
 * FADE_SEED_REQUIRE_CLIENTS — сід падає, якщо клієнт без CRM-профілю.
 */
export function runSeedE2e(timeout = 900_000): void {
  execFileSync('pnpm', ['--filter', '@fade/api', 'run', 'seed:e2e'], {
    cwd: API_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
    env: {
      ...process.env,
      FADE_SEED_FIXED_IDS: '1',
      FADE_SEED_REQUIRE_CLIENTS: '1',
    },
  });
}
