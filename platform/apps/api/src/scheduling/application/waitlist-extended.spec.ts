// Специфікація T-4559: керована черга — VIP-пріоритет, каскад пропозицій,
// прострочення → наступний, відмова клієнта, дії адміна, fuzzy window.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  applyAdminAction,
  adminQueueRows,
  cancelByClient,
  expireOffersWithReleases,
  planOfferCascade,
  selectBestSlot,
  MAX_CASCADE_OFFERS,
} from '../domain/waitlist-admin';
import {
  OFFER_WINDOW_MINUTES,
  priorityScore,
  type FreedSlot,
  type WaitlistEntryData,
} from '../domain/waitlist-queue';
import {
  InMemoryWaitlistExtendedRepository,
  ManageWaitlistService,
} from './manage-waitlist.use-case';
import { AdminWaitlistController } from './admin-waitlist.controller';

const NOW = new Date('2026-11-19T12:00:00Z');
const MINUTE = 60 * 1000;

const SLOT: FreedSlot = {
  locationId: 'loc-1',
  serviceId: 'svc-1',
  date: '2026-11-21',
  start: '10:00',
};

function entry(overrides: Partial<WaitlistEntryData> = {}): WaitlistEntryData {
  return {
    id: 'e-1',
    clientId: 'c-1',
    configuration: {
      locationId: 'loc-1',
      serviceId: 'svc-1',
      windowFrom: '2026-11-20',
      windowTo: '2026-11-22',
      precision: 'range',
    },
    status: 'waiting',
    waitingSince: NOW,
    consecutiveMisses: 0,
    ...overrides,
  };
}

function at(minutes: number): Date {
  return new Date(NOW.getTime() + minutes * MINUTE);
}

function service() {
  const repository = new InMemoryWaitlistExtendedRepository();
  return { repository, service: new ManageWaitlistService(repository) };
}

describe('waitlist priority with VIP tier (T-4559)', () => {
  it('adds a deterministic VIP bonus and keeps FIFO only as a tie-break', () => {
    const bronze = entry({ vipTier: 'BRONZE' });
    const silver = entry({ vipTier: 'silver' });
    const gold = entry({ vipTier: 'GOLD' });
    const platinum = entry({ vipTier: 'PLATINUM' });

    expect(priorityScore(bronze)).toBe(2); // вузьке вікно, без VIP-ваги
    expect(priorityScore(silver)).toBe(4);
    expect(priorityScore(gold)).toBe(7);
    expect(priorityScore(platinum)).toBe(10);
    expect(priorityScore(platinum)).toBe(priorityScore(entry({ vipTier: 'PLATINUM' })));

    expect(priorityScore(entry({ vipTier: 'unknown-tier' }))).toBe(2);
    expect(priorityScore(entry({ manualBias: 50 }))).toBe(52);
    expect(priorityScore(entry({ manualBias: -50 }))).toBe(-48);
  });

  it('orders the admin queue by priority and then by waiting time', () => {
    const rows = adminQueueRows(
      [
        entry({ id: 'late', waitingSince: at(10) }),
        entry({ id: 'early', waitingSince: NOW }),
        entry({ id: 'vip', vipTier: 'GOLD', waitingSince: at(30) }),
        entry({ id: 'gone', status: 'fulfilled' }),
      ],
      priorityScore
    );

    expect(rows.map((row) => row.id)).toEqual(['vip', 'early', 'late']);
  });
});

describe('waitlist offer lifecycle (T-4559)', () => {
  it('cascades simultaneous offers to the top candidates with individual holds', () => {
    const offers = planOfferCascade(
      [
        entry({ id: 'e-1' }),
        entry({ id: 'e-2', vipTier: 'GOLD' }),
        entry({ id: 'e-3', waitingSince: at(5) }),
        entry({ id: 'e-4', waitingSince: at(9) }),
        entry({ id: 'other', configuration: { ...entry().configuration, locationId: 'loc-2' } }),
      ],
      SLOT,
      { now: NOW }
    );

    expect(offers).toHaveLength(MAX_CASCADE_OFFERS);
    expect(offers.map((offer) => offer.entry.id)).toEqual(['e-2', 'e-1', 'e-3']);
    expect(offers.map((offer) => offer.rank)).toEqual([1, 2, 3]);
    expect(offers[0]?.entry.status).toBe('offered');
    expect(offers[0]?.holdExpiresAt).toEqual(
      new Date(NOW.getTime() + OFFER_WINDOW_MINUTES * MINUTE)
    );
    expect(offers[0]?.entry.history?.at(-1)).toMatchObject({ action: 'offered' });
    expect(offers[0]?.entry.configuration.locationId).toBe('loc-1');
  });

  it('respects a smaller cascade limit', () => {
    const offers = planOfferCascade([entry({ id: 'e-1' }), entry({ id: 'e-2' })], SLOT, {
      now: NOW,
      count: 1,
    });
    expect(offers.map((offer) => offer.entry.id)).toEqual(['e-1']);
  });

  it('releases expired offers and re-offers the slot to the next waiting client', async () => {
    const { service: queue } = service();
    await queue.register(entry({ id: 'first' }));

    const cascade = await queue.planOffers(SLOT, { now: NOW });
    expect(cascade.offers.map((offer) => offer.entry.id)).toEqual(['first']);

    // Клієнт, що приєднався пізніше, ще не отримував пропозиції.
    await queue.register(entry({ id: 'second', waitingSince: at(1) }));

    const reoffered = await queue.expireAndReoffer(SLOT, at(20));
    expect(reoffered.expiredIds).toEqual(['first']);
    expect(reoffered.offers.map((offer) => offer.entry.id)).toEqual(['second']);

    const rows = await queue.queue();
    expect(rows.rows.map((row) => row.id)).toEqual(['second']);

    const noop = await queue.expireAndReoffer(SLOT, at(21));
    expect(noop).toEqual({ expiredIds: [], offers: [] });
  });

  it('expires only due offers in the pure helper', () => {
    const { entries, expiredIds } = expireOffersWithReleases(
      [
        entry({ id: 'due', status: 'offered', holdExpiresAt: at(5) }),
        entry({ id: 'active', status: 'offered', holdExpiresAt: at(30) }),
        entry({ id: 'waiting' }),
      ],
      at(10)
    );

    expect(expiredIds).toEqual(['due']);
    expect(entries.find((item) => item.id === 'active')?.status).toBe('offered');
  });
});

describe('waitlist client cancellation (T-4559)', () => {
  it('cancels an offered entry and frees the hold immediately', () => {
    const { entry: cancelled, releasedHold } = cancelByClient(
      entry({ status: 'offered', holdExpiresAt: at(10) }),
      { by: 'c-1', at: at(2) }
    );

    expect(releasedHold).toBe(true);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.holdExpiresAt).toBeUndefined();
    expect(cancelled.history?.at(-1)).toMatchObject({ action: 'cancelled', by: 'c-1' });
  });

  it('cancels a waiting entry without a hold, is idempotent, and refuses fulfilled ones', () => {
    expect(cancelByClient(entry(), { by: 'c-1', at: at(1) }).releasedHold).toBe(false);

    const once = cancelByClient(entry(), { by: 'c-1', at: at(1) }).entry;
    expect(cancelByClient(once, { by: 'c-1', at: at(2) }).entry).toBe(once);

    expect(() => cancelByClient(entry({ status: 'fulfilled' }), { by: 'c-1' })).toThrow(
      'already fulfilled'
    );
  });

  it('frees the slot for the next client through the service', async () => {
    const { service: queue } = service();
    await queue.register(entry({ id: 'first' }));

    await queue.planOffers(SLOT, { now: NOW });
    await queue.register(entry({ id: 'second', waitingSince: at(1) }));

    const cancelled = await queue.cancel('first', { by: 'c-1', at: at(3) });
    expect(cancelled.releasedHold).toBe(true);

    const offers = await queue.planOffers(SLOT, { now: at(4) });
    expect(offers.offers.map((offer) => offer.entry.id)).toEqual(['second']);
  });
});

describe('waitlist admin management (T-4559)', () => {
  it('promotes with an audit log and requires operator + reason', () => {
    const promoted = applyAdminAction(entry(), 'promote', {
      by: 'admin-1',
      reason: 'скарга на сервіс',
      at: at(1),
    });

    expect(promoted.entry.override).toMatchObject({ by: 'admin-1', reason: 'скарга на сервіс' });
    expect(priorityScore(promoted.entry)).toBe(102);
    expect(promoted.entry.history?.at(-1)).toMatchObject({ action: 'promote', by: 'admin-1' });
    expect(promoted.log).toContain('waitlist.admin.promote');

    expect(() => applyAdminAction(entry(), 'promote', { by: 'admin-1', reason: '  ' })).toThrow(
      'requires a reason'
    );
    expect(() => applyAdminAction(entry(), 'pause', { by: ' ', reason: 'x' })).toThrow(
      'operator id'
    );
  });

  it('demotes, pauses, resumes and transfers between locations', () => {
    const promoted = applyAdminAction(entry(), 'promote', { by: 'admin-1', reason: 'x', at: at(1) })
      .entry;

    const demoted = applyAdminAction(promoted, 'demote', {
      by: 'admin-1',
      reason: 'повертаємо в чергу',
      at: at(2),
    }).entry;
    expect(demoted.manualBias).toBe(-100);
    expect(demoted.override).toBeUndefined();

    const paused = applyAdminAction(entry({ status: 'offered', holdExpiresAt: at(10) }), 'pause', {
      by: 'admin-1',
      reason: 'клієнт просив паузу',
      at: at(3),
    }).entry;
    expect(paused.status).toBe('paused');
    expect(paused.holdExpiresAt).toBeUndefined();

    const resumed = applyAdminAction(paused, 'resume', {
      by: 'admin-1',
      reason: 'пауза завершена',
      at: at(4),
    }).entry;
    expect(resumed.status).toBe('waiting');

    const transferred = applyAdminAction(entry(), 'transfer', {
      by: 'admin-1',
      reason: 'переїзд клієнта',
      at: at(5),
      targetLocationId: 'loc-2',
    }).entry;
    expect(transferred.configuration.locationId).toBe('loc-2');
    expect(transferred.configuration.serviceId).toBe('svc-1');

    expect(() =>
      applyAdminAction(entry(), 'transfer', { by: 'admin-1', reason: 'без адреси' })
    ).toThrow('target location');
  });

  it('runs the admin actions through the service and stores the history', async () => {
    const { service: queue } = service();
    await queue.register(entry({ id: 'e-1' }));

    const promoted = await queue.adminAction('e-1', 'promote', {
      by: 'admin-1',
      reason: 'клієнт постійний',
    });
    expect(promoted.entry.override).toBeDefined();

    const rows = await queue.queue('loc-1');
    expect(rows.total).toBe(1);
    expect(rows.rows[0]?.priority).toBe(102);
    expect((await queue.queue('loc-2')).total).toBe(0);

    expect((await queue.history('e-1')).map((item) => item.action)).toEqual(['promote']);
    await expect(queue.adminAction('missing', 'promote', { by: 'a', reason: 'b' })).rejects.toThrow(
      'not found'
    );
  });
});

describe('waitlist fuzzy window (T-4559)', () => {
  it('picks the earliest matching slot inside the client window', () => {
    const configuration = entry().configuration;
    const slots: FreedSlot[] = [
      { ...SLOT, date: '2026-11-22', start: '09:00' },
      { ...SLOT, date: '2026-11-20', start: '18:00' },
      { ...SLOT, date: '2026-11-20', start: '12:00' },
      { ...SLOT, date: '2026-11-25', start: '10:00' },
      { ...SLOT, serviceId: 'svc-2', date: '2026-11-20', start: '08:00' },
    ];

    expect(selectBestSlot(configuration, slots)).toMatchObject({
      date: '2026-11-20',
      start: '12:00',
    });
    expect(selectBestSlot({ ...configuration, serviceId: 'svc-other' }, slots)).toBeNull();
  });

  it('returns the best slot through the service and 404s on unknown entries', async () => {
    const { service: queue } = service();
    await queue.register(entry());
    expect(await queue.bestSlot('e-1', [{ ...SLOT, date: '2026-11-20' }])).toMatchObject({
      date: '2026-11-20',
    });
    await expect(queue.bestSlot('missing', [])).rejects.toThrow('not found');
  });
});

describe('AdminWaitlistController (T-4559)', () => {
  it('serves queue, actions, cancellation, cascade, expiry, best slot and history', async () => {
    const { service: queue } = service();
    const api = new AdminWaitlistController(queue);

    await api.register(entry({ id: 'e-1' }));

    expect((await api.queue('loc-1')).total).toBe(1);

    const promoted = await api.action('e-1', {
      action: 'promote',
      by: 'admin-1',
      reason: 'VIP-клієнт',
    });
    expect(promoted.entry.override).toBeDefined();

    const cascade = await api.cascade({ slot: SLOT, now: NOW.toISOString() });
    expect(cascade.offers.map((offer) => offer.entry.id)).toEqual(['e-1']);

    await api.register(entry({ id: 'e-2', waitingSince: at(1) }));

    const expired = await api.expire({ slot: SLOT, now: at(20).toISOString() });
    expect(expired.expiredIds).toEqual(['e-1']);
    expect(expired.offers.map((offer) => offer.entry.id)).toEqual(['e-2']);

    const cancelled = await api.cancel('e-2', { by: 'c-2', reason: 'передумав' });
    expect(cancelled.releasedHold).toBe(true);

    const best = await api.bestSlot('e-1', { slots: [SLOT] });
    expect(best.slot?.start).toBe('10:00');

    expect((await api.history('e-1')).items.map((item) => item.action)).toEqual([
      'promote',
      'offered',
      'expired',
    ]);
  });

  it('maps unknown entries to 404 and policy failures to 400', async () => {
    const { service: queue } = service();
    const api = new AdminWaitlistController(queue);

    await expect(api.cancel('missing', { by: 'c-1' })).rejects.toBeInstanceOf(NotFoundException);

    await api.register(entry({ id: 'e-1' }));
    await expect(
      api.action('e-1', { action: 'promote', by: 'admin-1', reason: '' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
