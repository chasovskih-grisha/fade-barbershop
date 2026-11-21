import {
  getOrCreateFunnelInstanceId,
  trackEvent,
  getUtmParamsFromUrl,
  persistUtmParams,
  getStoredUtmParams,
} from '../analytics';

describe('Analytics core utilities', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.amplitude = { track: jest.fn(), setUserId: jest.fn() };
    localStorage.clear();
  });

  it('generates a valid funnel instance id', () => {
    const fid = getOrCreateFunnelInstanceId();
    expect(fid).toMatch(/^fn_/);
  });

  it('pushes events to dataLayer and amplitude', () => {
    trackEvent('test_event', { foo: 'bar' });
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({ event: 'test_event', foo: 'bar' })
    );
    expect(window.amplitude?.track).toHaveBeenCalledWith(
      'test_event',
      expect.objectContaining({ foo: 'bar' })
    );
  });

  it('handles UTM params parsing, persistence and retrieval', () => {
    const utm = getUtmParamsFromUrl('?utm_source=instagram&utm_medium=cpc&utm_campaign=launch');
    expect(utm).toEqual({
      utm_source: 'instagram',
      utm_medium: 'cpc',
      utm_campaign: 'launch',
    });

    persistUtmParams('?utm_source=telegram&utm_medium=social');
    const stored = getStoredUtmParams();
    expect(stored.utm_source).toBe('telegram');
  });
});
