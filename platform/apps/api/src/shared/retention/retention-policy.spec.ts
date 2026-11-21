// T-4490: політика утримання — TTL, класифікація, legal hold.
import { RETENTION_RULES, cutoffFor, legalHolds, ruleFor } from './retention-policy';

const NOW = new Date('2026-11-17T10:00:00Z');

describe('retention policy (T-4490)', () => {
  it('кожен набір має класифікацію й додатний TTL', () => {
    for (const rule of RETENTION_RULES) {
      expect(rule.ttlDays).toBeGreaterThan(0);
      expect(['public', 'internal', 'confidential', 'personal']).toContain(rule.classification);
      expect(rule.note.length).toBeGreaterThan(0);
    }
  });

  it('персональні журнали тримаються 90 днів', () => {
    expect(ruleFor('notification_records')).toMatchObject({
      ttlDays: 90,
      classification: 'personal',
    });
    expect(ruleFor('otp_challenges')?.ttlDays).toBe(7);
  });

  it('cutoff рахується назад від поточного часу', () => {
    const rule = ruleFor('notification_records');
    if (!rule) throw new Error('rule missing');
    expect(cutoffFor(rule, NOW).toISOString()).toBe('2026-08-19T10:00:00.000Z');
  });

  it('legal hold читається з env і не чіпає інші набори', () => {
    const holds = legalHolds({
      RETENTION_LEGAL_HOLD: 'sessions, notification_records',
    } as NodeJS.ProcessEnv);
    expect(holds.has('sessions')).toBe(true);
    expect(holds.has('notification_records')).toBe(true);
    expect(holds.has('otp_challenges')).toBe(false);
    expect(legalHolds({} as NodeJS.ProcessEnv).size).toBe(0);
  });

  it('невідомий набір не має правила', () => {
    expect(ruleFor('unknown' as never)).toBeUndefined();
  });
});
