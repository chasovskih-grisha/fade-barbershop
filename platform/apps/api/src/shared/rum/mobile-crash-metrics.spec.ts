// Специфікація краш-лічильника застосунку (T-4443): приймає мінімальний звіт,
// лічить клас краху з підписом версія × платформа, відкидає невалідний семпл.
import { MobileCrashMetrics } from './mobile-crash-metrics';

const sample = {
  crashClass: 'TypeError: undefined is not a function',
  appVersion: '1.2.0',
  platform: 'ios',
};

describe('MobileCrashMetrics (T-4443)', () => {
  it('лічить клас краху за версією і платформою', () => {
    const metrics = new MobileCrashMetrics();
    expect(metrics.record(sample)).toBe(true);
    expect(metrics.record(sample)).toBe(true);

    expect(metrics.snapshot()).toEqual({
      'TypeError: undefined is not a function': { '1.2.0|ios': 2 },
    });
  });

  it('розділяє один клас між версіями та платформами', () => {
    const metrics = new MobileCrashMetrics();
    metrics.record(sample);
    metrics.record({ ...sample, appVersion: '1.3.0' });
    metrics.record({ ...sample, platform: 'android' });

    expect(metrics.snapshot()[sample.crashClass]).toEqual({
      '1.2.0|ios': 1,
      '1.3.0|ios': 1,
      '1.2.0|android': 1,
    });
  });

  it('відкидає порожній, невідомий або зіпсований семпл без винятку', () => {
    const metrics = new MobileCrashMetrics();
    expect(metrics.record({})).toBe(false);
    expect(metrics.record({ crashClass: 'E', appVersion: '1.2.0', platform: 'web' })).toBe(false);
    expect(metrics.record({ crashClass: 'E', appVersion: 'not a version!', platform: 'ios' })).toBe(
      false
    );
    expect(metrics.record(null)).toBe(false);
    expect(metrics.record('garbage')).toBe(false);

    expect(metrics.snapshot()).toEqual({});
  });
});
