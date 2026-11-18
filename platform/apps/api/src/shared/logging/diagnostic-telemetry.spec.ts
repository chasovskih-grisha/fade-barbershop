import { DailyFileLogger } from './daily-file.logger';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('FADE Diagnostic Telemetry & Structured Logging', () => {
  let tmpDir: string;
  let logger: DailyFileLogger;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'fade-telemetry-'));
    logger = new DailyFileLogger(tmpDir, 'api.log', () => new Date('2026-11-10T18:00:00.000Z'));
  });

  afterEach(async () => {
    await logger.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('records structured telemetry logs with ISO timestamp and context', async () => {
    logger.setContext('TelemetryDiagnostics');
    logger.log('System health check passed: geocoder active, outbox lag 0ms');

    await logger.close();
    const logPath = join(tmpDir, '2026/11/10', 'api.log');

    const content = readFileSync(logPath, 'utf8');
    const entry = JSON.parse(content.trim());

    expect(entry).toMatchObject({
      level: 'INFO',
      ctx: 'TelemetryDiagnostics',
      src: 'TelemetryDiagnostics',
      msg: 'System health check passed: geocoder active, outbox lag 0ms',
    });
    expect(typeof entry.ts).toBe('string');
    expect(new Date(entry.ts).toISOString()).toBe('2026-11-10T18:00:00.000Z');
  });

  it('captures error tracking diagnostics with stack trace and level ERROR', async () => {
    logger.setContext('ErrorTracker');
    const sampleError = new Error('Database connection pool exhausted');
    logger.error('Unhandled runtime fault', sampleError.stack, 'ErrorTracker');

    await logger.close();
    const logPath = join(tmpDir, '2026/11/10', 'api.log');

    const content = readFileSync(logPath, 'utf8');
    const entry = JSON.parse(content.trim());

    expect(entry).toMatchObject({
      level: 'ERROR',
      ctx: 'ErrorTracker',
      src: 'ErrorTracker',
    });
    expect(entry.msg).toContain('Database connection pool exhausted');
  });
});
