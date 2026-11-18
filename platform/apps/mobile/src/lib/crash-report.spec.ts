// Специфікація краш-коридору (T-4443): мінімальний звіт без PII, стабільний
// відбиток класу, HTTP-репортер не кидає на збої мережі.
import {
  buildCrashReport,
  crashClassOf,
  createHttpCrashReporter,
  normalizeMessage,
  type CrashReport,
} from './crash-report';

const CONTEXT = { appVersion: '1.2.0', platform: 'ios', occurredAt: '2026-11-17T00:00:00.000Z' };

describe('crash report (T-4443)', () => {
  it('нормалізує повідомлення: пошта, цифри, пробіли', () => {
    expect(normalizeMessage('  Failed for ivan@example.com at 1234 ms\n')).toBe(
      'Failed for <email> at # ms'
    );
  });

  it('відбиток класу стабільний для різних значень', () => {
    const a = crashClassOf({ name: 'TypeError', message: 'undefined id 42' });
    const b = crashClassOf({ name: 'TypeError', message: 'undefined id 77' });
    expect(a).toBe(b);
    expect(a).toBe('TypeError: undefined id #');
  });

  it('звіт мінімальний: клас, name, контекст — без повідомлення і стека', () => {
    const report = buildCrashReport({ name: 'RangeError', message: 'bad 9' }, CONTEXT);
    expect(report).toEqual({
      crashClass: 'RangeError: bad #',
      name: 'RangeError',
      ...CONTEXT,
    });
    expect(Object.keys(report).sort()).toEqual([
      'appVersion',
      'crashClass',
      'name',
      'occurredAt',
      'platform',
    ]);
  });

  it('HTTP-репортер шле JSON, а збій мережі ковтає', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: true })) as unknown as typeof fetch;
    const reporter = createHttpCrashReporter({
      endpoint: 'http://api.test/telemetry/mobile-crash',
      fetchImpl,
    });
    const report: CrashReport = { crashClass: 'E: x', name: 'E', ...CONTEXT };

    await reporter.report(report);
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://api.test/telemetry/mobile-crash',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(report) })
    );

    const failing = jest.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    await expect(
      createHttpCrashReporter({ endpoint: 'x', fetchImpl: failing }).report(report)
    ).resolves.toBeUndefined();
  });
});
