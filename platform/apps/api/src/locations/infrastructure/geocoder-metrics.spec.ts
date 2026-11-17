// Специфікація GeocoderMetrics: лічильники стартують з нуля, increment
// росте на 1, snapshot повертає повний зріз навіть для нечипаних лічильників.

import { GeocoderMetrics } from './geocoder-metrics';

describe('GeocoderMetrics', () => {
  it('snapshot повертає нулі для всіх лічильників одразу після створення', () => {
    expect(new GeocoderMetrics().snapshot()).toEqual({
      cache_hit: 0,
      cache_miss: 0,
      rate_limit_rejected: 0,
      tombstoned: 0,
      provider_failure: 0,
      provider_success: 0,
    });
  });

  it('increment росте на 1 за кожен виклик і не скидається', () => {
    const m = new GeocoderMetrics();
    m.increment('cache_hit');
    m.increment('cache_hit');
    m.increment('provider_failure');
    expect(m.snapshot()).toMatchObject({ cache_hit: 2, provider_failure: 1 });
    expect(m.snapshot()).toMatchObject({ cache_hit: 2, provider_failure: 1 });
  });

  it('лічильники незалежні один від одного', () => {
    const m = new GeocoderMetrics();
    m.increment('rate_limit_rejected');
    m.increment('tombstoned');
    m.increment('tombstoned');
    m.increment('tombstoned');
    expect(m.snapshot()).toMatchObject({
      rate_limit_rejected: 1,
      tombstoned: 3,
      cache_hit: 0,
      cache_miss: 0,
      provider_failure: 0,
      provider_success: 0,
    });
  });
});
