// Контракт лога (observability.md §2 + T-4204f): базові поля стабільні;
// без активного спана traceId/spanId у рядку НЕ з'являються (відсутність —
// не null), щоб promtail/LogQL не бачили сміттєвих значень.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DailyFileLogger } from './daily-file.logger';

const makeLogger = () => {
  const root = mkdtempSync(join(tmpdir(), 'fade-log-'));
  const day = new Date();
  const key = `${day.getFullYear()}/${String(day.getMonth() + 1).padStart(2, '0')}/${String(day.getDate()).padStart(2, '0')}`;
  return { logger: new DailyFileLogger(root), root, file: join(root, key, 'api.log') };
};

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs.length = 0;
});

describe('DailyFileLogger trace correlation (T-4204f)', () => {
  it('без активного спана рядок містить лише контракт §2 (без traceId)', async () => {
    const { logger, root, file } = makeLogger();
    dirs.push(root);
    logger.log('hello', 'Test');
    await logger.close();
    const row = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
    expect(row).toMatchObject({ level: 'INFO', ctx: 'Test', msg: 'hello' });
    expect(row.traceId).toBeUndefined();
    expect(row.spanId).toBeUndefined();
  });

  it('error-рядок лишиться валідним JSON зі стеком у msg', async () => {
    const { logger, file } = makeLogger();
    logger.error('boom', 'Error: boom\n    at x', 'Test');
    await logger.close();
    const row = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
    expect(row.level).toBe('ERROR');
    expect(row.msg).toContain('at x');
  });
});
