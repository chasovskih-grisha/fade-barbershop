import { NoShowProgressiveDepositEscalationEngine } from './no-show-progressive-deposit-escalation';

describe('NoShowProgressiveDepositEscalationEngine', () => {
  const engine = new NoShowProgressiveDepositEscalationEngine();
  const now = new Date('2026-11-12T12:00:00Z');

  it('allows clean client with 0 no-shows with 0% deposit', () => {
    const result = engine.assessClientEscalation(
      {
        clientId: 'client-1',
        noShowEvents: [],
      },
      1000,
      now
    );

    expect(result.activeStrikeCount).toBe(0);
    expect(result.requiredDepositPercent).toBe(0);
    expect(result.isSuspended).toBe(false);
    expect(result.recommendedAction).toBe('NONE');
  });

  it('triggers soft warning and 25% deposit for 1 unexcused no-show', () => {
    const result = engine.assessClientEscalation(
      {
        clientId: 'client-2',
        noShowEvents: [{ timestamp: new Date('2026-10-15T12:00:00Z'), servicePrice: 1000 }],
      },
      1000,
      now
    );

    expect(result.activeStrikeCount).toBe(1);
    expect(result.requiredDepositPercent).toBe(25);
    expect(result.isSuspended).toBe(false);
    expect(result.recommendedAction).toBe('SOFT_WARNING');
  });

  it('triggers mandatory 50% deposit for 2 unexcused no-shows', () => {
    const result = engine.assessClientEscalation(
      {
        clientId: 'client-3',
        noShowEvents: [
          { timestamp: new Date('2026-10-01T12:00:00Z'), servicePrice: 1000 },
          { timestamp: new Date('2026-10-20T12:00:00Z'), servicePrice: 1000 },
        ],
      },
      1000,
      now
    );

    expect(result.activeStrikeCount).toBe(2);
    expect(result.requiredDepositPercent).toBe(50);
    expect(result.isSuspended).toBe(false);
    expect(result.recommendedAction).toBe('MANDATORY_DEPOSIT');
  });

  it('triggers account suspension for 3+ unexcused no-shows', () => {
    const result = engine.assessClientEscalation(
      {
        clientId: 'client-4',
        noShowEvents: [
          { timestamp: new Date('2026-09-01T12:00:00Z'), servicePrice: 1000 },
          { timestamp: new Date('2026-09-15T12:00:00Z'), servicePrice: 1000 },
          { timestamp: new Date('2026-10-10T12:00:00Z'), servicePrice: 1000 },
        ],
      },
      1000,
      now
    );

    expect(result.activeStrikeCount).toBe(3);
    expect(result.isSuspended).toBe(true);
    expect(result.recommendedAction).toBe('ACCOUNT_SUSPENDED');
  });

  it('respects administrator waiver and exempts penalties', () => {
    const result = engine.assessClientEscalation(
      {
        clientId: 'client-5',
        noShowEvents: [
          { timestamp: new Date('2026-09-01T12:00:00Z'), servicePrice: 1000 },
          { timestamp: new Date('2026-09-15T12:00:00Z'), servicePrice: 1000 },
          { timestamp: new Date('2026-10-10T12:00:00Z'), servicePrice: 1000 },
        ],
        adminWaiverActive: true,
      },
      1000,
      now
    );

    expect(result.requiredDepositPercent).toBe(0);
    expect(result.isSuspended).toBe(false);
    expect(result.recommendedAction).toBe('NONE');
  });
});
