// Специфікація initRum (T-4204): реєстрація пʼяти метрик, ідемпотентність
// (StrictMode/HMR не подвоюють семпли), семплінг і DNT. Решта контракту
// клієнта — rum.test.ts.
import { initRum, resetRum } from '../rum';

type Sink = (metric: { name: string; rating: string }) => void;
const mockSink: Sink[] = [];

// Фабрика мока виконується при першому require('web-vitals') — тому стрілки,
// а не посилання на const (інакше TDZ).
jest.mock('web-vitals', () => ({
  onLCP: (callback: Sink) => mockSink.push(callback),
  onCLS: (callback: Sink) => mockSink.push(callback),
  onINP: (callback: Sink) => mockSink.push(callback),
  onFCP: (callback: Sink) => mockSink.push(callback),
  onTTFB: (callback: Sink) => mockSink.push(callback),
}));

function transport(): { beacon: jest.Mock; fetch: jest.Mock } {
  return { beacon: jest.fn().mockReturnValue(true), fetch: jest.fn() };
}

describe('initRum', () => {
  beforeEach(() => {
    mockSink.length = 0;
    resetRum();
    Object.defineProperty(navigator, 'doNotTrack', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: undefined,
      configurable: true,
    });
  });

  it('реєструє пʼять метрик і шле семпл (name, rating)', () => {
    const fake = transport();
    expect(initRum({ rate: 1, transport: fake })).toBe(true);
    expect(mockSink).toHaveLength(5);
    mockSink[0]?.({ name: 'LCP', rating: 'needs-improvement' });
    expect(fake.beacon).toHaveBeenCalledTimes(1);
  });

  it('повторний виклик не подвоює реєстрацію (StrictMode/HMR)', () => {
    const fake = transport();
    initRum({ rate: 1, transport: fake });
    expect(initRum({ rate: 1, transport: fake })).toBe(false);
    expect(mockSink).toHaveLength(5);
  });

  it('семплінг 0 — не реєструє', () => {
    expect(initRum({ rate: 0, transport: transport() })).toBe(false);
    expect(mockSink).toHaveLength(0);
  });

  it('DNT — не реєструє навіть при rate 1', () => {
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    expect(initRum({ rate: 1, transport: transport() })).toBe(false);
    expect(mockSink).toHaveLength(0);
  });
});
