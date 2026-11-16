import { AdvancedAttributionEngine, Touchpoint } from '../src/advanced-attribution';

describe('Advanced Attribution Engine', () => {
  const engine = new AdvancedAttributionEngine();

  it('calculates linear multi-touch attribution correctly', () => {
    const touchpoints: Touchpoint[] = [
      { channel: 'organic', timestamp: 1000 },
      { channel: 'social', timestamp: 2000 },
      { channel: 'paid_search', timestamp: 3000 }
    ];

    const result = engine.calculateAttribution('user_99', 150, touchpoints, 'linear');
    expect(result.attributedChannels).toHaveLength(3);
    expect(result.attributedChannels.find(c => c.channel === 'paid_search')?.share).toBeCloseTo(0.3333, 3);
  });

  it('calculates time-decay multi-touch attribution correctly', () => {
    const touchpoints: Touchpoint[] = [
      { channel: 'organic', timestamp: 1000 },
      { channel: 'paid_search', timestamp: 3000 }
    ];

    const result = engine.calculateAttribution('user_100', 200, touchpoints, 'time-decay');
    expect(result.attributedChannels).toHaveLength(2);
    const lastTp = result.attributedChannels.find(c => c.channel === 'paid_search');
    const firstTp = result.attributedChannels.find(c => c.channel === 'organic');
    expect(lastTp!.share).toBeGreaterThan(firstTp!.share);
  });
});
