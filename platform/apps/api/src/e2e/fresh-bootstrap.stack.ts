// Життєвий цикл docker-стейджу для fresh-bootstrap e2e: підйом, очікування
// postgres, запуск сіду. Запити до БД — у fresh-bootstrap.docker.ts.
//
// Стек — одноразовий (див. коментар у fresh-bootstrap.docker.ts): окремий
// compose-проєкт, окремі томи й окремий хост-порт postgres. Застосунки
// (профіль apps) не входять у типовий прогін: твердження сюїти про базу і
// сід, а контейнерам застосунків потрібна холодна інсталяція node_modules у
// свій том — це інсталяція образу, не bootstrap бази. Хто хоче повний стек:
// FADE_FRESH_BOOTSTRAP_PROFILES=deps,apps.
import { execFileSync } from 'child_process';
import { setTimeout } from 'timers/promises';
import { join } from 'path';
import {
  databaseUrl,
  dockerExec,
  pgIsReady,
  REDIS_PORT,
  WITH_APPS,
} from './fresh-bootstrap.docker';

// __dirname = apps/api/src/e2e → два рівні вгору до кореня пакета api.
// Попереднє `../../../apps/api` розв'язувалось у platform/apps/apps/api
// (не існує): execFileSync кидав spawnSync ENOENT, бо cwd не знайдено.
const API_ROOT = join(__dirname, '../..');

/** Сервіси, яких потребує сід: сама БД і її сусіди по профілю deps. */
const DEPS_SERVICES = ['postgres', 'redis', 'minio'] as const;

/** Повне перезапущення стейджу: down -v, потім up -d --wait. */
export function resetStack(): void {
  // --remove-orphans: контейнери попереднього прогону з іншим набором
  // сервісів не мають лишатися жити в тому самому проєкті.
  dockerExec(['down', '-v', '--remove-orphans']);
  const services = WITH_APPS ? [] : [...DEPS_SERVICES];
  dockerExec(['up', '-d', '--wait', '--wait-timeout', '180', ...services]);
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
 * DATABASE_URL — база throwaway-стеку (інакше сід пішов би в ту базу, на яку
 * дивиться оболонка розробника; на цьому й тримається ізоляція прогону),
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
      DATABASE_URL: databaseUrl(),
      REDIS_URL: `redis://127.0.0.1:${REDIS_PORT}`,
      FADE_SEED_FIXED_IDS: '1',
      FADE_SEED_REQUIRE_CLIENTS: '1',
    },
  });
}
