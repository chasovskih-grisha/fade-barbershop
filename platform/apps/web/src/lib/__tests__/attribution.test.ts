import { recordTouchpoint, getJourneyTouchpoints, calculateAttributionWeights } from '../attribution';

describe('FADE Attribution & Journey Intelligence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records and retrieves touchpoints correctly', () => {
    recordTouchpoint({ source: 'google', medium: 'cpc', campaign: 'summer_fade' });
    recordTouchpoint({ source: 'instagram', medium: 'social' });

    const touchpoints = getJourneyTouchpoints();
    expect(touchpoints.length).toBe(2);
    expect(touchpoints[0]?.source).toBe('google');
    expect(touchpoints[1]?.source).toBe('instagram');
  });

  it('calculates first touch attribution weights', () => {
    recordTouchpoint({ source: 'google', medium: 'cpc' });
    recordTouchpoint({ source: 'instagram', medium: 'social' });

    const weights = calculateAttributionWeights('first_touch');
    expect(weights['google/cpc']).toBe(1.0);
    expect(weights['instagram/social']).toBeUndefined();
  });

  it('calculates last touch attribution weights', () => {
    recordTouchpoint({ source: 'google', medium: 'cpc' });
    recordTouchpoint({ source: 'instagram', medium: 'social' });

    const weights = calculateAttributionWeights('last_touch');
    expect(weights['instagram/social']).toBe(1.0);
  });

  it('calculates linear attribution weights', () => {
    recordTouchpoint({ source: 'google', medium: 'cpc' });
    recordTouchpoint({ source: 'instagram', medium: 'social' });

    const weights = calculateAttributionWeights('linear');
    expect(weights['google/cpc']).toBe(0.5);
    expect(weights['instagram/social']).toBe(0.5);
  });
});
