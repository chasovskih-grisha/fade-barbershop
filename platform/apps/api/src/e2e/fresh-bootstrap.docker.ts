// Обгортка docker compose для fresh-bootstrap e2e: запити до БД через psql.
// Життєвий цикл стейджу (up/down/pg_isready) — у fresh-bootstrap.stack.ts.
//
// Сюїта знищує томи (`down -v`), тому вона НІКОЛИ не працює на робочому
// проєкті розробника. Ізоляція — три речі разом:
//   1) окремий проєкт (`-p fade-fresh-bootstrap`): власні томи `…_pg_data`;
//   2) override infra/docker-compose.fresh-bootstrap.yml: інші container_name,
//      інша мережа й інші хост-порти (базовий файл задає їх явно, тож сам `-p`
//      їх не розводить);
//   3) цей модуль відмовляється працювати, якщо підсумковий проєкт збігається
//      з робочим (`fade-platform`).
import { execFileSync } from 'child_process';
import { join } from 'path';

// __dirname = apps/api/src/e2e → піднятися на 4 рівні до кореня platform,
// де лежить infra/docker-compose.yml.
const INFRA = join(__dirname, '../../../../infra');
const COMPOSE = join(INFRA, 'docker-compose.yml');
const OVERRIDE = join(INFRA, 'docker-compose.fresh-bootstrap.yml');

/** Проєкт за замовчуванням; перекривається FADE_FRESH_BOOTSTRAP_PROJECT. */
export const PROJECT = process.env.FADE_FRESH_BOOTSTRAP_PROJECT ?? 'fade-fresh-bootstrap';

/** Робочий проєкт розробника — його чіпати не можна ніколи. */
const SHARED_PROJECT = 'fade-platform';

/** Профілі стеку. `deps` — усе, що потрібно сідові; `apps` — контейнери
 * застосунків (їм потрібна холодна інсталяція node_modules у свій том). */
const PROFILES = (process.env.FADE_FRESH_BOOTSTRAP_PROFILES ?? 'deps')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

export const WITH_APPS = PROFILES.includes('apps');

/** Хост-порти throwaway-стеку: у базовому стеку ті самі порти зайняті. */
export const PG_PORT = process.env.FADE_FRESH_BOOTSTRAP_PG_PORT ?? '25432';
export const REDIS_PORT = process.env.FADE_FRESH_BOOTSTRAP_REDIS_PORT ?? '26379';

export const DB = { user: 'barbershop', password: 'barbershop', db: 'barbershop' } as const;

/** URL бази throwaway-стеку: сід має писати саме сюди, а не в dev-базу. */
export function databaseUrl(): string {
  return `postgresql://${DB.user}:${DB.password}@127.0.0.1:${PG_PORT}/${DB.db}?schema=public`;
}

function exec(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** Запобіжник: `down -v` на робочому проєкті знищив би dev-дані. */
function assertIsolated(): void {
  if (PROJECT === SHARED_PROJECT) {
    throw new Error(
      `[fresh-bootstrap] refusing to run in the shared project "${SHARED_PROJECT}": ` +
        'the spec wipes volumes with `down -v`. Use FADE_FRESH_BOOTSTRAP_PROJECT.'
    );
  }
}

/**
 * Виклик docker compose з профілями, обома файлами й окремим проєктом.
 *
 * `--profile` — глобальний прапорець compose (до підкоманди) і потрібен навіть
 * для `down`: без нього compose не бачить сервісів з вимкнених профілів,
 * вважає стек порожнім і мовчки завершується з кодом 0, лишаючи контейнери й
 * томи жити. Саме так cleanup і «проходив» раніше.
 */
export function dockerExec(args: string[]): string {
  assertIsolated();
  const profiles = PROFILES.flatMap((profile) => ['--profile', profile]);
  return exec('docker', [
    'compose',
    ...profiles,
    '-f',
    COMPOSE,
    '-f',
    OVERRIDE,
    '-p',
    PROJECT,
    ...args,
  ]);
}

/** psql у контейнері postgres throwaway-стеку; повертає stdout запиту. */
export function psql(sql: string): string {
  return dockerExec(['exec', '-T', 'postgres', 'psql', '-U', DB.user, '-d', DB.db, '-c', sql]);
}

/** pg_isready у контейнері postgres — кидає, якщо БД ще не приймає запити. */
export function pgIsReady(): void {
  dockerExec(['exec', '-T', 'postgres', 'pg_isready', '-U', DB.user, '-d', DB.db]);
}
