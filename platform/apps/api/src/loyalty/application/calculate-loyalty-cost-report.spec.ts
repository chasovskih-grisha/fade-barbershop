import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import { CalculateLoyaltyCostReportHandler } from './calculate-loyalty-cost-report.use-case';

describe('CalculateLoyaltyCostReportHandler (Loyalty Cost & Liability Report T-4466)', () => {
  it('calculates total financial liability, free visits reserve, and tier breakdown correctly', () => {
    const handler = new CalculateLoyaltyCostReportHandler(1.0, 800.0);

    const now = new Date('2026-11-12T12:00:00Z');
    const state1 = ClientLoyaltyState.createNew('client-1', now);
    state1.processCompletedAppointment('apt-1', 7, false, now);
    state1.processCompletedAppointment('apt-2', 7, false, now);

    const state2 = ClientLoyaltyState.createNew('client-2', now);
    // 7 visits triggers free visit (threshold = 7)
    for (let i = 0; i < 7; i++) {
      state2.processCompletedAppointment(`apt-2-${i}`, 7, false, now);
    }

    const state3 = ClientLoyaltyState.createNew('client-3', now);
    state3.setTier('PLATINUM', now);

    const report = handler.handle({
      allStates: [state1, state2, state3],
      freeVisitEquivalentUah: 900.0,
    });

    expect(report.totalClientsWithLoyalty).toBe(3);
    expect(report.totalCompletedVisitsRecorded).toBe(2 + 7); // 9 visits total
    expect(report.freeVisitsAvailableCount).toBe(1); // state2 reached 7 visits and triggered free visit
    expect(report.freeVisitsReserveLiabilityUah).toBe(900.0);
    expect(report.tierDistribution['BRONZE']).toBe(1); // client-1 (2 visits)
    expect(report.tierDistribution['SILVER']).toBe(1); // client-2 (7 visits + free visit)
    expect(report.tierDistribution['PLATINUM']).toBe(1); // client-3
    expect(report.estimatedFinancialLiabilityUah).toBe(900.0);
  });
});
