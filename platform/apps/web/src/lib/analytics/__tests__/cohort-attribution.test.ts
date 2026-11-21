import { recordTouchpoint, getAttributionReport } from '../cohort-attribution';

describe('Conversion Attribution & Cohort Allocation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records touchpoints and generates attribution report with cohort info', () => {
    const tp1 = recordTouchpoint(
      '/landing',
      'utm_source=google&utm_medium=cpc&utm_campaign=fade_launch'
    );
    expect(tp1.source).toBe('google');
    expect(tp1.medium).toBe('cpc');

    const report = getAttributionReport();
    expect(report.firstTouch).not.toBeNull();
    expect(report.firstTouch?.source).toBe('google');
    expect(report.cohortMonth).toMatch(/^\d{4}-\d{2}$/);
    expect(report.cohortWeek).toMatch(/^\d{4}-W\d{2}$/);
    expect(report.attributionWeights['google/cpc']).toBeGreaterThan(0);
  });
});
