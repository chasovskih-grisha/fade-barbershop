import { DailyFileLogger } from './daily-file.logger';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function todayKey(): string {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function readEntries(root: string, key = todayKey()): Array<Record<string, unknown>> {
  const file = join(root, key, 'api.log');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Record<string, unknown>);
}

describe('DailyFileLogger rotation/closing/defaults', () => {
  it('a second day opens a fresh file under a new YYYY/MM/DD path', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fade-logs-'));
    let current = new Date('2026-03-15T10:00:00.000Z');
    const clock = { now: () => current };
    const logger = new DailyFileLogger(root, 'api.log', clock.now);
    logger.log('day-one', 'App');

    current = new Date('2026-03-16T09:00:00.000Z');
    logger.log('day-two', 'App');
    await logger.close();

    const dayOne = join(root, '2026/03/15', 'api.log');
    const dayTwo = join(root, '2026/03/16', 'api.log');
    expect(existsSync(dayOne)).toBe(true);
    expect(existsSync(dayTwo)).toBe(true);
    const secondDay = JSON.parse(readFileSync(dayTwo, 'utf8').trim()) as Record<string, unknown>;
    expect(secondDay.msg).toBe('day-two');
    rmSync(root, { recursive: true, force: true });
  });

  it('close() when no stream opened is a no-op', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fade-logs-'));
    const logger = new DailyFileLogger(root, 'api.log');
    await expect(logger.close()).resolves.toBeUndefined();
    rmSync(root, { recursive: true, force: true });
  });

  it('uses default context and default file name when omitted', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fade-logs-'));
    const logger = new DailyFileLogger(root);
    logger.warn('w');
    logger.error('boom');
    logger.debug?.('d');
    logger.verbose?.('v');
    logger.fatal?.('f');
    await logger.close();
    const lines = readEntries(root);
    expect(lines.map((l) => l.level)).toEqual(['WARN', 'ERROR', 'DEBUG', 'VERBOSE', 'FATAL']);
    expect(lines[0]?.ctx).toBe('App');
    expect(lines[1]?.msg).toBe('boom');
    rmSync(root, { recursive: true, force: true });
  });
});
