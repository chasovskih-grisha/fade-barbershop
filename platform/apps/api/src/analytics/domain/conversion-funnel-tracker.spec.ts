import { ConversionFunnelTracker, FunnelEventRecord } from './conversion-funnel-tracker';

describe('ConversionFunnelTracker', () => {
  it('tracks funnel progression and calculates conversion rates correctly', () => {
    const tracker = new ConversionFunnelTracker();

    const now = new Date();
    const events: FunnelEventRecord[] = [
      { sessionId: 'sess-1', step: 'LANDING_VIEW', timestamp: now },
      { sessionId: 'sess-1', step: 'SERVICE_SELECT', timestamp: now },
      { sessionId: 'sess-1', step: 'BARBER_SELECT', timestamp: now },
      { sessionId: 'sess-1', step: 'SLOT_SELECT', timestamp: now },
      { sessionId: 'sess-1', step: 'CONTACT_AUTH', timestamp: now },
      { sessionId: 'sess-1', step: 'PAYMENT_INIT', timestamp: now },
      { sessionId: 'sess-1', step: 'APPOINTMENT_BOOKED', timestamp: now },
      { sessionId: 'sess-1', step: 'APPOINTMENT_COMPLETED', timestamp: now },

      { sessionId: 'sess-2', step: 'LANDING_VIEW', timestamp: now },
      { sessionId: 'sess-2', step: 'SERVICE_SELECT', timestamp: now },
      // Drop-off at barber select for sess-2

      { sessionId: 'sess-3', step: 'LANDING_VIEW', timestamp: now },
      { sessionId: 'sess-3', step: 'SERVICE_SELECT', timestamp: now },
      { sessionId: 'sess-3', step: 'BARBER_SELECT', timestamp: now },
      { sessionId: 'sess-3', step: 'SLOT_SELECT', timestamp: now },
      { sessionId: 'sess-3', step: 'CONTACT_AUTH', timestamp: now },
      // Drop-off at payment init for sess-3
    ];

    for (const ev of events) {
      tracker.recordEvent(ev);
    }

    const report = tracker.generateReport();

    expect(report.totalSessions).toBe(3);
    expect(report.overallConversionRatePercent).toBe(33.33); // 1 out of 3 completed
    expect(report.steps.length).toBe(8);

    const landingStep = report.steps.find((s) => s.step === 'LANDING_VIEW');
    expect(landingStep?.enteredCount).toBe(3);

    const serviceStep = report.steps.find((s) => s.step === 'SERVICE_SELECT');
    expect(serviceStep?.enteredCount).toBe(3);
  });

  it('identifies critical drop-off step and generates recommendations', () => {
    const tracker = new ConversionFunnelTracker();
    const now = new Date();

    // 10 sessions drop off heavily at CONTACT_AUTH
    for (let i = 1; i <= 10; i++) {
      tracker.recordEvent({ sessionId: `sess-${i}`, step: 'LANDING_VIEW', timestamp: now });
      tracker.recordEvent({ sessionId: `sess-${i}`, step: 'SERVICE_SELECT', timestamp: now });
      tracker.recordEvent({ sessionId: `sess-${i}`, step: 'BARBER_SELECT', timestamp: now });
      tracker.recordEvent({ sessionId: `sess-${i}`, step: 'SLOT_SELECT', timestamp: now });
      // Only 2 proceed to contact auth
      if (i <= 2) {
        tracker.recordEvent({ sessionId: `sess-${i}`, step: 'CONTACT_AUTH', timestamp: now });
      }
    }

    const report = tracker.generateReport();
    expect(report.totalSessions).toBe(10);
    expect(report.criticalDropOffStep).toBe('CONTACT_AUTH');
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});
