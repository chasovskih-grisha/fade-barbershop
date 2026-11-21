/* eslint-disable max-lines -- cohesive module (181 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація оцінки очікування, статусів адмінки й подій черги (T-170a).
import {
  ETA_DEFAULTS,
  estimateWaitMinutes,
  promotionRate,
  timeBucketForLocalHour,
} from './waitlist-eta';
import { adminRows, configurationKey, summarizeQueues } from './waitlist-status';
import {
  WaitlistEntryJoined,
  WaitlistOfferExpired,
  WaitlistOfferSent,
  WaitlistOverrideApplied,
} from './waitlist.events';
import type { WaitlistConfiguration, WaitlistEntryData } from './waitlist-queue';

const NOW = new Date('2026-11-19T15:00:00Z');

function configuration(overrides: Partial<WaitlistConfiguration> = {}): WaitlistConfiguration {
  return {
    locationId: 'loc-1',
    serviceId: 'svc-1',
    barberId: 'bar-1',
    windowFrom: '2026-11-15',
    windowTo: '2026-11-29',
    precision: 'range',
    ...overrides,
  };
}

function entry(overrides: Partial<WaitlistEntryData> = {}): WaitlistEntryData {
  return {
    id: 'w-1',
    clientId: 'c-1',
    configuration: configuration(),
    status: 'waiting',
    waitingSince: new Date('2026-11-19T13:00:00Z'),
    consecutiveMisses: 0,
    ...overrides,
  };
}

describe('wait-time estimate (T-170a interface)', () => {
  it('maps local hours to day buckets', () => {
    expect(timeBucketForLocalHour(9)).toBe('morning');
    expect(timeBucketForLocalHour(13)).toBe('afternoon');
    expect(timeBucketForLocalHour(19)).toBe('evening');
  });

  it('falls back to conservative defaults without history', () => {
    const eta = estimateWaitMinutes({ position: 1, localHour: 13 });

    expect(eta.promotionRate).toBe(ETA_DEFAULTS.promotionRate);
    expect(eta.freedSlotsPerHour).toBe(ETA_DEFAULTS.freedSlotsPerHour);
    expect(eta.bucket).toBe('afternoon');
    expect(eta.minutes).toBeGreaterThan(0);
  });

  it('waits longer when fewer offers are accepted', () => {
    const fast = estimateWaitMinutes({
      position: 2,
      localHour: 13,
      history: { offersSent: 100, offersAccepted: 80, slotsFreedPerHour: { afternoon: 2 } },
    });
    const slow = estimateWaitMinutes({
      position: 2,
      localHour: 13,
      history: { offersSent: 100, offersAccepted: 20, slotsFreedPerHour: { afternoon: 2 } },
    });

    expect(slow.minutes).toBeGreaterThan(fast.minutes);
  });

  it('clamps the promotion rate and ignores broken history', () => {
    expect(promotionRate({ offersSent: 10, offersAccepted: 10 })).toBe(0.95);
    expect(promotionRate({ offersSent: 10, offersAccepted: 0 })).toBe(0.05);
    expect(promotionRate({ offersSent: 0, offersAccepted: 5 })).toBe(ETA_DEFAULTS.promotionRate);
  });

  it('uses the time-of-day rate instead of the global one', () => {
    const evening = estimateWaitMinutes({
      position: 1,
      localHour: 19,
      history: { slotsFreedPerHour: { morning: 4, evening: 0.5 } },
    });
    const morning = estimateWaitMinutes({
      position: 1,
      localHour: 9,
      history: { slotsFreedPerHour: { morning: 4, evening: 0.5 } },
    });

    expect(evening.freedSlotsPerHour).toBe(0.5);
    expect(evening.minutes).toBeGreaterThan(morning.minutes);
  });

  it('adds time for a party and a long service, and rounds to 5 minutes', () => {
    const single = estimateWaitMinutes({ position: 3, localHour: 13 });
    const party = estimateWaitMinutes({ position: 3, localHour: 13, partySize: 3 });
    const long = estimateWaitMinutes({ position: 3, localHour: 13, durationMinutes: 90 });

    expect(party.minutes).toBeGreaterThan(single.minutes);
    expect(long.minutes).toBeGreaterThan(single.minutes);
    expect(single.minutes % ETA_DEFAULTS.stepMinutes).toBe(0);
  });

  it('keeps the estimate inside the promised bounds', () => {
    const tiny = estimateWaitMinutes({
      position: 1,
      localHour: 13,
      history: { slotsFreedPerHour: { afternoon: 50 } },
    });
    const huge = estimateWaitMinutes({ position: 900, localHour: 13 });

    expect(tiny.minutes).toBe(ETA_DEFAULTS.minMinutes);
    expect(huge.minutes).toBe(ETA_DEFAULTS.maxMinutes);
  });
});

describe('admin queue view (T-170a statuses)', () => {
  it('groups entries by configuration and counts statuses', () => {
    const summaries = summarizeQueues(
      [
        entry({ id: 'w-1' }),
        entry({ id: 'w-2', waitingSince: new Date('2026-11-19T14:00:00Z') }),
        entry({ id: 'w-3', status: 'paused' }),
        entry({ id: 'w-4', configuration: configuration({ barberId: null }) }),
      ],
      NOW,
      { localHour: 17 }
    );

    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.configurationId).toBe('loc-1|svc-1|bar-1');
    expect(summaries[0]?.waiting).toBe(2);
    expect(summaries[0]?.paused).toBe(1);
    expect(summaries[0]?.oldestWaitingMinutes).toBe(120);
    expect(summaries[0]?.eta).not.toBeNull();
    expect(summaries[1]?.configurationId).toBe(configurationKey(configuration({ barberId: null })));
    expect(summaries[1]?.barberId).toBeNull();
  });

  it('labels statuses and surfaces the operator override reason', () => {
    const rows = adminRows(
      [
        entry({ id: 'w-wait' }),
        entry({ id: 'w-offer', status: 'offered' }),
        entry({ id: 'w-pause', status: 'paused' }),
        entry({ id: 'w-done', status: 'fulfilled' }),
        entry({
          id: 'w-override',
          override: { by: 'admin-1', reason: 'клієнт прийшов у салон', at: NOW },
        }),
      ],
      NOW
    );

    expect(rows.map((row) => row.status)).toEqual([
      'чекає',
      'є пропозиція',
      'на паузі',
      'закрита',
      'чекає',
    ]);
    expect(rows[0]?.waitingMinutes).toBe(120);
    expect(rows[4]?.overrideReason).toBe('клієнт прийшов у салон');
  });
});

describe('waitlist domain events (T-170a)', () => {
  it('names joined/offer/expiry events for the outbox', () => {
    const joined = new WaitlistEntryJoined({ entry: entry(), occurredAt: NOW });
    const offered = new WaitlistOfferSent({
      entry: {
        ...entry(),
        status: 'offered',
        holdExpiresAt: new Date(NOW.getTime() + 15 * 60_000),
      },
      occurredAt: NOW,
    });
    const expired = new WaitlistOfferExpired({
      entry: { ...entry(), status: 'expired' },
      occurredAt: NOW,
    });

    expect(joined.type).toBe('scheduling.waitlist.joined');
    expect(joined.aggregateId).toBe('w-1');
    expect(joined.payload.configurationId).toBe('loc-1|svc-1|bar-1');
    expect(joined.payload.precision).toBe('range');
    expect(offered.payload.holdExpiresAt).toBe('2026-11-19T15:15:00.000Z');
    expect(expired.payload.entryId).toBe('w-1');
    expect(expired.occurredAt).toEqual(NOW);
  });

  it('carries the operator and reason on an override event', () => {
    const event = new WaitlistOverrideApplied({
      entry: entry({
        override: { by: 'admin-1', reason: 'клієнт прийшов у салон', at: NOW },
      }),
    });

    expect(event.type).toBe('scheduling.waitlist.override_applied');
    expect(event.payload.actorId).toBe('admin-1');
    expect(event.payload.reason).toBe('клієнт прийшов у салон');
  });
});
