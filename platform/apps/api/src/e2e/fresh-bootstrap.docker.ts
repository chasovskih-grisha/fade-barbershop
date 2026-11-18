// Обгортка docker compose для fresh-bootstrap e2e: запити до БД через psql.
// Життєвий цикл стейджу (up/down/pg_isready) — у fresh-bootstrap.stack.ts.
import { execFileSync } from 'child_process';
import { join } from 'path';

// __dirname = apps/api/src/e2e → піднятися на 4 рівні до кореня platform,
// де лежить infra/docker-compose.yml.
const COMPOSE = join(__dirname, '../../../../infra/docker-compose.yml');
const DB = { user: 'barbershop', db: 'barbershop' } as const;

function exec(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** Виклик docker compose -f infra/docker-compose.yml <args>. */
export function dockerExec(args: string[]): string {
  return exec('docker', ['compose', '-f', COMPOSE, ...args]);
}

/** psql у контейнері postgres; повертає stdout запиту. */
export function psql(sql: string): string {
  return exec('docker', [
    'compose',
    '-f',
    COMPOSE,
    'exec',
    '-T',
    'postgres',
    'psql',
    '-U',
    DB.user,
    '-d',
    DB.db,
    '-c',
    sql,
  ]);
}

/** pg_isready у контейнері postgres — кидає, якщо БД ще не приймає запити. */
export function pgIsReady(): void {
  exec('docker', [
    'compose',
    '-f',
    COMPOSE,
    'exec',
    '-T',
    'postgres',
    'pg_isready',
    '-U',
    DB.user,
    '-d',
    DB.db,
  ]);
}
