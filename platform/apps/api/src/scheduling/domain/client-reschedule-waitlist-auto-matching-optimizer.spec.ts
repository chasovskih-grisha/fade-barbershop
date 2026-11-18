import { optimizeWaitlistAutoMatching, WaitlistCandidate, SlotAvailabilityOpening } from './client-reschedule-waitlist-auto-matching-optimizer';

describe('ClientRescheduleWaitlistAutoMatchingOptimizer', () => {
  const opening: SlotAvailabilityOpening = {
    slotId: 'slot_open_101',
    locationId: 'loc_main',
    barberId: 'barber_alex',
    startTime: new Date('2026-11-12T10:00:00Z'),
    endTime: new Date('2026-11-12T11:00:00Z'),
    availableDurationMinutes: 60,
  };

  it('should rank VIP candidates with perfect duration fit highest', () => {
    const candidates: WaitlistCandidate[] = [
      {
        candidateId: 'cand_1',
        clientId: 'cli_1',
        clientName: 'John Doe',
        isVip: false,
        historicalNoShowRate: 0.1,
        requestedServiceDurationMinutes: 45,
        waitlistedAt: new Date(),
        flexibleWithBarber: true,
      },
      {
        candidateId: 'cand_2',
        clientId: 'cli_2',
        clientName: 'Jane Smith',
        isVip: true,
        historicalNoShowRate: 0.0,
        preferredBarberId: 'barber_alex',
        requestedServiceDurationMinutes: 60,
        waitlistedAt: new Date(),
        flexibleWithBarber: false,
      },
    ];

    const results = optimizeWaitlistAutoMatching(candidates, opening);
    expect(results.length).toBe(2);
    const res0 = results[0];
    if (!res0) throw new Error('Expected res0');
    expect(res0.candidateId).toBe('cand_2');
    expect(res0.priorityTier).toBe('URGENT_VIP');
    expect(res0.autoOfferRecommended).toBe(true);
  });

  it('should filter out candidates exceeding max no-show threshold', () => {
    const candidates: WaitlistCandidate[] = [
      {
        candidateId: 'cand_bad',
        clientId: 'cli_bad',
        clientName: 'Risky Renter',
        isVip: false,
        historicalNoShowRate: 0.4,
        requestedServiceDurationMinutes: 30,
        waitlistedAt: new Date(),
        flexibleWithBarber: true,
      },
    ];

    const results = optimizeWaitlistAutoMatching(candidates, opening);
    const res0 = results[0];
    if (!res0) throw new Error('Expected res0');
    expect(res0.matchScore).toBe(0);
    expect(res0.autoOfferRecommended).toBe(false);
    expect(res0.reason).toContain('high historical no-show rate');
  });

  it('should filter out candidates whose requested duration exceeds slot opening', () => {
    const candidates: WaitlistCandidate[] = [
      {
        candidateId: 'cand_long',
        clientId: 'cli_long',
        clientName: 'Long Service',
        isVip: true,
        historicalNoShowRate: 0.0,
        requestedServiceDurationMinutes: 90,
        waitlistedAt: new Date(),
        flexibleWithBarber: true,
      },
    ];

    const results = optimizeWaitlistAutoMatching(candidates, opening);
    const res0 = results[0];
    if (!res0) throw new Error('Expected res0');
    expect(res0.matchScore).toBe(0);
    expect(res0.reason).toContain('insufficient for requested service');
  });
});
