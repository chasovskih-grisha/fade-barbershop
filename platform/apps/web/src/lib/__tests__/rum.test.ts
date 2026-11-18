// Специфікація RUM-клієнта (T-4204): семплінг, транспорт sendBeacon →
// keepalive-fetch, повага до DNT/GPC. web-vitals тут порожній мок — реєстрацію
// пʼяти метрик перевіряє rum-init.test.ts (LOC-гейт тримає файли ≤100 рядків).
import { RUM_ENDPOINT, rumAllowed, sampleRate, sendSample, shouldSample } from '../rum';

jest.mock('web-vitals', () => ({}));

type FakeTransport = { beacon: jest.Mock<boolean, [string, Blob]>; fetch: jest.Mock };

function transport(beaconResult = true): FakeTransport {
  return { beacon: jest.fn().mockReturnValue(beaconResult), fetch: jest.fn() };
}

describe('sampleRate', () => {
  it('дефолт — кожна сесія; значення поза 0..1 затискаються', () => {
    expect(sampleRate(undefined)).toBe(1);
    expect(sampleRate('')).toBe(1);
    expect(sampleRate('0.25')).toBe(0.25);
    expect(sampleRate('5')).toBe(1);
    expect(sampleRate('-1')).toBe(0);
  });

  it('сміття в env не вимикає збір мовчки', () => {
    expect(sampleRate('abc')).toBe(1);
  });
});

describe('shouldSample', () => {
  it('0 — ніколи, 1 — завжди, дріб — за random()', () => {
    expect(shouldSample(0, () => 0)).toBe(false);
    expect(shouldSample(1, () => 0.99)).toBe(true);
    expect(shouldSample(0.5, () => 0.4)).toBe(true);
    expect(shouldSample(0.5, () => 0.6)).toBe(false);
  });
});

describe('sendSample', () => {
  it('beacon везе JSON-blob на /telemetry/web-vitals', () => {
    const fake = transport(true);
    expect(sendSample({ name: 'LCP', rating: 'good' }, fake)).toBe(true);
    const call = fake.beacon.mock.calls[0];
    expect(call?.[0]).toBe(RUM_ENDPOINT);
    expect(call?.[1]?.type).toBe('application/json');
    expect(fake.fetch).not.toHaveBeenCalled();
  });

  it('beacon відмовив — keepalive-fetch з тим самим тілом', () => {
    const fake = transport(false);
    expect(sendSample({ name: 'CLS', rating: 'poor' }, fake)).toBe(true);
    expect(fake.fetch).toHaveBeenCalledWith(RUM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'CLS', rating: 'poor' }),
      keepalive: true,
    });
  });

  it('транспорт кинув — назовні не летить (RUM не ламає сторінку)', () => {
    const fake = transport(true);
    fake.beacon.mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(sendSample({ name: 'FCP', rating: 'good' }, fake)).toBe(false);
  });

  it('без транспорту (SSR) — false', () => {
    expect(sendSample({ name: 'TTFB', rating: 'good' }, null)).toBe(false);
  });
});

describe('rumAllowed', () => {
  const define = (key: string, value: unknown): void => {
    Object.defineProperty(navigator, key, { value, configurable: true });
  };

  afterEach(() => {
    define('doNotTrack', undefined);
    define('globalPrivacyControl', undefined);
  });

  it('без сигналів відмови — збираємо', () => {
    expect(rumAllowed()).toBe(true);
  });

  it('DNT=1 — вимкнено', () => {
    define('doNotTrack', '1');
    expect(rumAllowed()).toBe(false);
  });

  it('GPC — вимкнено', () => {
    define('globalPrivacyControl', true);
    expect(rumAllowed()).toBe(false);
  });
});
