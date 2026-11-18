import { ConversionAttributionAnalyzer, AttributedSession } from './conversion-attribution-analyzer';

describe('ConversionAttributionAnalyzer', () => {
  it('correctly calculates metrics per acquisition channel and identifies top channel', () => {
    const sessions: AttributedSession[] = [
      { sessionId: 's1', channel: 'ORGANIC', revenue: 500, completed: true, events: [] },
      { sessionId: 's2', channel: 'ORGANIC', revenue: 0, completed: false, events: [] },
      { sessionId: 's3', channel: 'REFERRAL', revenue: 1200, completed: true, events: [] },
      { sessionId: 's4', channel: 'REFERRAL', revenue: 800, completed: true, events: [] },
      { sessionId: 's5', channel: 'CAMPAIGN', campaignCode: 'WINBACK20', revenue: 600, completed: true, events: [] },
    ];

    const analyzer = new ConversionAttributionAnalyzer(sessions);
    const report = analyzer.generateReport();

    expect(report.overallAttributedRevenue).toBe(3100);
    expect(report.topChannel).toBe('REFERRAL');

    const referralMetrics = report.channels.find(c => c.channel === 'REFERRAL');
    expect(referralMetrics?.totalSessions).toBe(2);
    expect(referralMetrics?.completedBookings).toBe(2);
    expect(referralMetrics?.conversionRatePercent).toBe(100);
    expect(referralMetrics?.totalRevenue).toBe(2000);
    expect(referralMetrics?.averageRevenuePerBooking).toBe(1000);

    expect(report.insights.length).toBeGreaterThan(0);
  });
});
