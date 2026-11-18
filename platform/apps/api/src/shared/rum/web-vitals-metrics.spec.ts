// Специфікація WebVitalsMetrics (RUM, T-4204): білий список метрик і рейтингів,
// регістронезалежна нормалізація, відмова без винятку для сміття з мережі.
import { WebVitalsMetrics } from './web-vitals-metrics';

describe('WebVitalsMetrics', () => {
  it('рахує семпл за парою metric × rating і агрегує повторні', () => {
    const metrics = new WebVitalsMetrics();
    expect(metrics.record({ name: 'lcp', rating: 'good' })).toBe(true);
    expect(metrics.record({ name: 'lcp', rating: 'good' })).toBe(true);
    metrics.record({ name: 'cls', rating: 'poor' });
    expect(metrics.snapshot()).toEqual({ lcp: { good: 2 }, cls: { poor: 1 } });
  });

  it('нормалізує регістр і пробіли (маяк може прислати LCP/GOOD)', () => {
    const metrics = new WebVitalsMetrics();
    expect(metrics.record({ name: ' LCP ', rating: ' Good ' })).toBe(true);
    expect(metrics.snapshot()).toEqual({ lcp: { good: 1 } });
  });

  it('відкидає невідому метрику, невідомий рейтинг і не-рядки', () => {
    const metrics = new WebVitalsMetrics();
    expect(metrics.record({ name: 'fid', rating: 'good' })).toBe(false);
    expect(metrics.record({ name: 'lcp', rating: 'average' })).toBe(false);
    expect(metrics.record({ name: 42, rating: 'good' })).toBe(false);
    expect(metrics.record({})).toBe(false);
    expect(metrics.snapshot()).toEqual({});
  });

  it('не кидає на null/undefined і не створює серію', () => {
    const metrics = new WebVitalsMetrics();
    expect(() => metrics.record(null)).not.toThrow();
    expect(() => metrics.record(undefined)).not.toThrow();
    expect(metrics.snapshot()).toEqual({});
  });

  it('значення з клієнта не стає лейблом — кардинальність фіксована', () => {
    const metrics = new WebVitalsMetrics();
    metrics.record({ name: 'inp', rating: 'good', value: 123.4, id: 'v3-123', path: '/booking' });
    expect(metrics.snapshot()).toEqual({ inp: { good: 1 } });
  });
});
