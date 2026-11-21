/* eslint-disable max-lines -- cohesive module (223 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-4452: етапи no-show (фіксація → сповіщення → пропозиція →
// депозит), повний журнал і заборона повторного запису в лімітні дні.
import {
  NO_SHOW_STAGED_DEFAULTS,
  advanceStage,
  assessRebook,
  canAdvance,
  depositSettlementDueAt,
  noShowSummary,
  openNoShow,
  rebookBlockedUntil,
  settleDeposit,
  type NoShowStagedRecord,
} from '../domain/no-show-stage.policy';
import {
  InMemoryNoShowStagedRepository,
  NoShowStagedResponseService,
} from './no-show-staged-response.service';

const NOW = new Date('2026-11-19T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function at(days: number, hours = 0): Date {
  return new Date(NOW.getTime() + days * DAY + hours * 60 * 60 * 1000);
}

function record(overrides: Partial<NoShowStagedRecord> = {}): NoShowStagedRecord {
  return {
    ...openNoShow({
      id: 'ns-1',
      clientId: 'c-1',
      appointmentId: 'apt-1',
      depositAmount: 200,
      actorId: 'system',
      at: NOW,
    }),
    ...overrides,
  };
}

function walkedThrough(): NoShowStagedRecord {
  const detected = record();
  const notified = advanceStage(detected, 'notified', { actorId: 'system', at: at(0, 1) });
  return advanceStage(notified, 'rebook_offered', { actorId: 'system', at: at(0, 2) });
}

function service(config = NO_SHOW_STAGED_DEFAULTS) {
  const repository = new InMemoryNoShowStagedRepository();
  return { repository, service: new NoShowStagedResponseService(repository, config) };
}

describe('no-show stage policy (T-4452)', () => {
  it('opens the case at detected with the first journal entry', () => {
    const opened = record();

    expect(opened.stage).toBe('detected');
    expect(opened.journal).toHaveLength(1);
    expect(opened.journal[0]).toMatchObject({ action: 'detected', actor: 'system' });
    expect(() =>
      openNoShow({
        id: 'x',
        clientId: 'c',
        appointmentId: 'a',
        depositAmount: -1,
        actorId: 'system',
      })
    ).toThrow('negative');
  });

  it('only allows one stage at a time and never backwards', () => {
    const opened = record();

    expect(canAdvance(opened, 'notified')).toEqual({ allowed: true, reason: '' });
    expect(canAdvance(opened, 'deposit_settled').allowed).toBe(false);
    expect(canAdvance(opened, 'detected')).toEqual({
      allowed: false,
      reason: 'Stage already reached',
    });

    const notified = advanceStage(opened, 'notified', { actorId: 'system', at: at(0, 1) });
    expect(canAdvance(notified, 'detected').allowed).toBe(false);
    expect(() => advanceStage(notified, 'detected', { actorId: 'admin-1', at: at(0, 2) })).toThrow(
      'backwards'
    );
  });

  it('settles the deposit once, with the amount and actor in the journal', () => {
    const offered = walkedThrough();

    const settled = settleDeposit(offered, {
      actorId: 'admin-1',
      decision: 'retained',
      amount: 200,
      note: 'NSH-ADM-02: клієнт не попередив',
      at: at(1),
    });

    expect(settled.stage).toBe('deposit_settled');
    expect(settled.depositDecision).toBe('retained');
    expect(settled.journal.at(-1)).toMatchObject({
      action: 'deposit_settled',
      actor: 'admin-1',
      amount: 200,
    });

    expect(settleDeposit(settled, { actorId: 'admin-2', decision: 'refunded', at: at(2) })).toBe(
      settled
    );
    expect(settled.journal).toHaveLength(4);
  });

  it('rejects settlement before the offer and amounts above the deposit', () => {
    expect(() =>
      settleDeposit(record(), { actorId: 'admin-1', decision: 'retained', at: at(1) })
    ).toThrow('after the rebooking offer');

    expect(() =>
      settleDeposit(walkedThrough(), {
        actorId: 'admin-1',
        decision: 'refunded',
        amount: 500,
        at: at(1),
      })
    ).toThrow('between 0 and 200');
  });

  it('blocks rebooking on the limit days and reports when it opens', () => {
    const offered = walkedThrough();

    const blocked = assessRebook(offered, NO_SHOW_STAGED_DEFAULTS, at(1));
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toContain('blocked');
    expect(blocked.retryAfter).toEqual(rebookBlockedUntil(offered, NO_SHOW_STAGED_DEFAULTS));

    expect(assessRebook(offered, NO_SHOW_STAGED_DEFAULTS, at(3)).allowed).toBe(true);
  });

  it('allows an admin override inside the limit days only when config allows it', () => {
    const offered = walkedThrough();

    expect(
      assessRebook(offered, NO_SHOW_STAGED_DEFAULTS, at(1), { manualAllow: true }).allowed
    ).toBe(false);

    const permissive = { ...NO_SHOW_STAGED_DEFAULTS, allowManualRebookOnLimitDays: true };
    expect(assessRebook(offered, permissive, at(1), { manualAllow: true }).allowed).toBe(true);
  });

  it('closes the rebooking offer after the configured window', () => {
    const offered = walkedThrough();
    const later = assessRebook(offered, NO_SHOW_STAGED_DEFAULTS, at(20));

    expect(later.allowed).toBe(false);
    expect(later.reason).toContain('expired');
  });

  it('summarises the case for the audit report and schedules deposit settlement', () => {
    const offered = walkedThrough();

    expect(noShowSummary(offered)).toMatchObject({
      id: 'ns-1',
      clientId: 'c-1',
      stage: 'rebook_offered',
      depositAmount: 200,
      entries: 3,
      elapsedMinutes: 120,
    });
    expect(depositSettlementDueAt(offered, NO_SHOW_STAGED_DEFAULTS)).toEqual(at(1));
  });
});

describe('NoShowStagedResponseService (T-4452)', () => {
  it('registers the case once and walks it to deposit settlement', async () => {
    const { repository, service: noShow } = service();

    await noShow.register({
      id: 'ns-1',
      clientId: 'c-1',
      appointmentId: 'apt-1',
      depositAmount: 200,
      actorId: 'system',
      at: NOW,
    });
    await noShow.register({
      id: 'ns-1',
      clientId: 'c-1',
      appointmentId: 'apt-1',
      actorId: 'system',
      at: NOW,
    });
    expect((await noShow.journal('ns-1')).length).toBe(1);

    await noShow.advance('ns-1', 'notified', { actorId: 'system', at: at(0, 1) });
    await noShow.advance('ns-1', 'rebook_offered', { actorId: 'admin-1', at: at(0, 2) });
    await noShow.settle('ns-1', {
      actorId: 'admin-1',
      decision: 'retained',
      at: at(1),
    });

    const stored = await repository.findById('ns-1');
    expect(stored?.stage).toBe('deposit_settled');
    expect(stored?.depositDecision).toBe('retained');
    expect(await noShow.settlementDueAt('ns-1')).toEqual(at(1));
  });

  it('records the denied rebooking attempt in the journal during the limit days', async () => {
    const { service: noShow } = service();
    await noShow.register({
      id: 'ns-1',
      clientId: 'c-1',
      appointmentId: 'apt-1',
      depositAmount: 200,
      actorId: 'system',
      at: NOW,
    });
    await noShow.advance('ns-1', 'notified', { actorId: 'system', at: at(0, 1) });
    await noShow.advance('ns-1', 'rebook_offered', { actorId: 'system', at: at(0, 2) });

    const denied = await noShow.requestRebook('ns-1', { at: at(1) });
    expect(denied.allowed).toBe(false);
    expect(denied.record.journal.at(-1)).toMatchObject({ action: 'rebook_denied' });

    const allowed = await noShow.requestRebook('ns-1', { at: at(3) });
    expect(allowed.allowed).toBe(true);
    expect(allowed.record.journal.at(-1)).toMatchObject({ action: 'rebook_requested' });
  });

  it('does not rebook a client who was never notified', async () => {
    const { service: noShow } = service({ ...NO_SHOW_STAGED_DEFAULTS, rebookLimitDays: 0 });
    await noShow.register({
      id: 'ns-1',
      clientId: 'c-1',
      appointmentId: 'apt-1',
      actorId: 'system',
      at: NOW,
    });

    const result = await noShow.requestRebook('ns-1', { at: at(1) });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not been notified');
  });

  it('lists cases due for automation and rejects unknown cases', async () => {
    const { service: noShow } = service();
    await noShow.register({
      id: 'ns-new',
      clientId: 'c-1',
      appointmentId: 'apt-1',
      actorId: 'system',
      at: NOW,
    });

    const due = await noShow.dueForAutomation(at(0, 1));
    expect(due.map((item) => item.id)).toEqual(['ns-new']);

    await noShow.advance('ns-new', 'notified', { actorId: 'system', at: at(0, 1) });
    await noShow.advance('ns-new', 'rebook_offered', { actorId: 'system', at: at(0, 2) });

    expect((await noShow.dueForAutomation(at(0, 3))).map((item) => item.id)).toEqual([]);
    expect((await noShow.dueForAutomation(at(1))).map((item) => item.id)).toEqual(['ns-new']);
    await expect(noShow.summary('missing')).rejects.toThrow('not found');
  });
});
