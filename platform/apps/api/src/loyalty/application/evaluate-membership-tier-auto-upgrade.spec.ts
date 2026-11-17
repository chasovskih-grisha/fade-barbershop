import { EvaluateMembershipTierAutoUpgradeHandler } from './evaluate-membership-tier-auto-upgrade.use-case';
import { ClientLoyaltyState } from '../domain/client-loyalty-state';

describe('EvaluateMembershipTierAutoUpgradeHandler', () => {
  it('automatically upgrades tier when visits or points increase', async () => {
    const memoryStates = new Map<string, ClientLoyaltyState>();
    const mockContext: any = {
      clock: { now: () => new Date('2026-11-13T10:00:00Z') },
      states: {
        findByClientId: async (id: string) => memoryStates.get(id) || null,
        save: async (st: ClientLoyaltyState) => { memoryStates.set(st.clientId, st); },
      },
    };

    const handler = new EvaluateMembershipTierAutoUpgradeHandler(mockContext);

    // Initial state (Bronze)
    const res1 = await handler.handle({
      clientId: 'client-999',
      completedVisitsToAdd: 3,
    });
    expect(res1.currentTier).toBe('BRONZE');
    expect(res1.upgraded).toBe(false);

    // Push visits to reach Silver (typically 7 visits for free visit / tier progression)
    const res2 = await handler.handle({
      clientId: 'client-999',
      completedVisitsToAdd: 4, // Total 7 visits -> Silver
    });
    expect(res2.currentTier).toBe('SILVER');
    expect(res2.upgraded).toBe(true);
    expect(res2.unlockedPerks.length).toBeGreaterThan(0);

    // Push points to reach Gold via points override (needs 2500 total)
    const res3 = await handler.handle({
      clientId: 'client-999',
      earnedPointsToAdd: 2500, // Total points >= 2500 -> Gold
    });
    expect(res3.currentTier).toBe('GOLD');
    expect(res3.upgraded).toBe(true);
  });
});
