// Специфікація T-4453: пріоритетний вибір із черги, тайм-аут пропозиції,
// каскад на наступного та ручне втручання оператора з журналом.
import type { SmsSender } from '../../notifications/application/send-sms.use-case';
import { SendWaitlistOfferSms } from '../../notifications/application/send-sms.use-case';
import { SmsWaitlistOfferNotifier } from '../../notifications/application/waitlist-offer-notifier';
import {
  OFFER_WINDOW_MINUTES,
  type FreedSlot,
  type WaitlistConfiguration,
  type WaitlistEntryData,
} from '../domain/waitlist-queue';
import {
  OfferNextWaitlistCandidate,
  type WaitlistOfferNotifier,
} from './waitlist-offer.use-case';

const NOW = new Date('2026-11-19T12:00:00Z');
const slot: FreedSlot = {
  locationId: 'loc-1',
  serviceId: 'svc-1',
  barberId: 'bar-1',
  date: '2026-11-20',
  start: '14:00',
};

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
    waitingSince: new Date('2026-11-15T10:00:00Z'),
    consecutiveMisses: 0,
    ...overrides,
  };
}

function notifier() {
  const offers: Array<{ entryId: string; clientId: string; expiresAt: Date }> = [];
  const expired: string[] = [];
  const fake: WaitlistOfferNotifier = {
    sendOffer: async (input) => {
      offers.push({ entryId: input.entryId, clientId: input.clientId, expiresAt: input.expiresAt });
    },
    sendExpired: async (input) => {
      expired.push(input.entryId);
    },
  };
  return { fake, offers, expired };
}

function harness() {
  const { fake, offers, expired } = notifier();
  return { useCase: new OfferNextWaitlistCandidate(fake, () => NOW), offers, expired };
}

describe('waitlist priority selection (T-4453)', () => {
  it('prefers a loyal client over an older first-timer', async () => {
    const { useCase, offers } = harness();
    const olderFirstTimer = entry({ id: 'w-old', waitingSince: new Date('2026-11-15T08:00:00Z') });
    const newerLoyal = entry({
      id: 'w-loyal',
      clientId: 'c-loyal',
      waitingSince: new Date('2026-11-16T08:00:00Z'),
      completedVisits: 5,
    });

    const result = await useCase.execute({ entries: [olderFirstTimer, newerLoyal], slot, now: NOW });

    expect(result.offered?.id).toBe('w-loyal');
    expect(offers[0]?.clientId).toBe('c-loyal');
  });

  it('keeps FIFO among equal priorities', async () => {
    const { useCase } = harness();
    const older = entry({ id: 'w-old', waitingSince: new Date('2026-11-15T08:00:00Z') });
    const newer = entry({ id: 'w-new', waitingSince: new Date('2026-11-16T08:00:00Z') });

    const result = await useCase.execute({ entries: [newer, older], slot, now: NOW });

    expect(result.offered?.id).toBe('w-old');
  });

  it('demotes an entry after missed offers', async () => {
    const { useCase } = harness();
    const olderWithMisses = entry({
      id: 'w-missed',
      waitingSince: new Date('2026-11-15T08:00:00Z'),
      consecutiveMisses: 2,
    });
    const newerClean = entry({ id: 'w-clean', waitingSince: new Date('2026-11-16T08:00:00Z') });

    const result = await useCase.execute({ entries: [olderWithMisses, newerClean], slot, now: NOW });

    expect(result.offered?.id).toBe('w-clean');
  });

  it('boosts an exact-date request over a wide range', async () => {
    const { useCase } = harness();
    const wideRange = entry({
      id: 'w-wide',
      waitingSince: new Date('2026-11-15T08:00:00Z'),
      configuration: configuration({ precision: 'range' }),
    });
    const exact = entry({
      id: 'w-exact',
      waitingSince: new Date('2026-11-16T08:00:00Z'),
      configuration: configuration({ precision: 'exact', windowFrom: '2026-11-20', windowTo: '2026-11-20' }),
    });

    const result = await useCase.execute({ entries: [wideRange, exact], slot, now: NOW });

    expect(result.offered?.id).toBe('w-exact');
  });

  it('does not offer a group request to a single-chair slot', async () => {
    const { useCase } = harness();
    const group = entry({ configuration: configuration({ groupSize: 3 }) });

    const result = await useCase.execute({ entries: [group], slot, now: NOW });

    expect(result.offered).toBeNull();
    expect(result.log).toContain('waitlist.offer.empty');
  });
});

describe('offer timeout and cascade (T-4453)', () => {
  it('sets a 15-minute soft-hold when offering', async () => {
    const { useCase, offers } = harness();

    const result = await useCase.execute({ entries: [entry()], slot, now: NOW });

    expect(result.offered?.status).toBe('offered');
    expect(result.offered?.holdExpiresAt).toEqual(
      new Date(NOW.getTime() + OFFER_WINDOW_MINUTES * 60_000)
    );
    expect(offers[0]?.expiresAt).toEqual(result.offered?.holdExpiresAt);
  });

  it('does not offer twice while a hold is active', async () => {
    const { useCase, offers } = harness();
    const holding = entry({
      id: 'w-holding',
      status: 'offered',
      holdExpiresAt: new Date(NOW.getTime() + 5 * 60_000),
    });

    const result = await useCase.execute({
      entries: [holding, entry({ id: 'w-next' })],
      slot,
      now: NOW,
    });

    expect(result.offered).toBeNull();
    expect(result.log).toContain('waitlist.offer.held entry=w-holding');
    expect(offers).toHaveLength(0);
  });

  it('expires the timed-out offer and cascades to the next candidate', async () => {
    const { useCase, offers, expired } = harness();
    const timedOut = entry({
      id: 'w-timed-out',
      status: 'offered',
      holdExpiresAt: new Date(NOW.getTime() - 60_000),
    });
    const waiting = entry({
      id: 'w-waiting',
      clientId: 'c-next',
      waitingSince: new Date('2026-11-16T08:00:00Z'),
    });

    const result = await useCase.execute({ entries: [timedOut, waiting], slot, now: NOW });

    expect(result.expiredEntryIds).toEqual(['w-timed-out']);
    expect(expired).toEqual(['w-timed-out']);
    expect(result.offered?.id).toBe('w-waiting');
    expect(offers).toHaveLength(1);
  });

  it('accepts only inside the hold and marks the entry fulfilled', () => {
    const { useCase } = harness();
    const offered = {
      ...entry({ status: 'offered' }),
      holdExpiresAt: new Date(NOW.getTime() + 60_000),
    };

    expect(useCase.accept({ entry: offered, now: NOW }).status).toBe('fulfilled');
    expect(() =>
      useCase.accept({ entry: { ...offered, holdExpiresAt: new Date(NOW.getTime() - 1) }, now: NOW })
    ).toThrow('has expired');
  });
});

describe('operator override (T-4453)', () => {
  it('lifts a chosen entry above constructive priorities and logs the reason', async () => {
    const { useCase } = harness();
    const loyal = entry({
      id: 'w-loyal',
      waitingSince: new Date('2026-11-15T08:00:00Z'),
      completedVisits: 6,
    });
    const chosen = entry({ id: 'w-chosen', waitingSince: new Date('2026-11-18T08:00:00Z') });
    const override = { by: 'admin-1', reason: 'клієнт прийшов у салон', at: NOW };

    const overridden = useCase.override({ entries: [loyal, chosen], entryId: 'w-chosen', override });
    const result = await useCase.execute({
      entries: overridden.entries,
      slot,
      now: NOW,
    });

    expect(result.offered?.id).toBe('w-chosen');
    expect(overridden.log).toContain('waitlist.override');
    expect(overridden.log).toContain('by=admin-1');
    expect(overridden.log).toContain('reason=клієнт прийшов у салон');
  });

  it('refuses an override without a reason and for an unknown entry', () => {
    const { useCase } = harness();

    expect(() =>
      useCase.override({
        entries: [entry()],
        entryId: 'w-1',
        override: { by: 'admin-1', reason: '  ', at: NOW },
      })
    ).toThrow('Operator override requires a reason');

    expect(() =>
      useCase.override({
        entries: [entry()],
        entryId: 'missing',
        override: { by: 'admin-1', reason: 'boost', at: NOW },
      })
    ).toThrow('not found');
  });
});

describe('SMS delivery reuses the existing senders (743ddbb)', () => {
  it('sends the offer and the expired notice through SendWaitlistOfferSms', async () => {
    const sent: Array<{ to: string; text: string }> = [];
    const sender: SmsSender = {
      send: async (input) => {
        sent.push(input);
      },
    };
    const adapter = new SmsWaitlistOfferNotifier(new SendWaitlistOfferSms(sender), {
      findPhone: async (clientId) => (clientId === 'c-1' ? '+380671112233' : null),
    });
    const useCase = new OfferNextWaitlistCandidate(adapter, () => NOW);

    await useCase.execute({ entries: [entry()], slot, now: NOW });
    await useCase.execute({
      entries: [
        entry({
          id: 'w-late',
          status: 'offered',
          holdExpiresAt: new Date(NOW.getTime() - 60_000),
        }),
      ],
      slot,
      now: NOW,
    });

    expect(sent[0]?.to).toBe('+380671112233');
    expect(sent[0]?.text).toContain('є вільний слот');
    expect(sent[0]?.text).toContain('Підтвердіть до');
    expect(sent[1]?.text).toContain('час на підтвердження слота минув');
  });

  it('skips sending when the client has no phone', async () => {
    const sent: Array<{ to: string; text: string }> = [];
    const adapter = new SmsWaitlistOfferNotifier(
      new SendWaitlistOfferSms({ send: async (input) => void sent.push(input) }),
      { findPhone: async () => null }
    );

    await adapter.sendOffer({ entryId: 'w-1', clientId: 'c-1', slot, expiresAt: NOW });
    await adapter.sendExpired({ entryId: 'w-1', clientId: 'c-1' });

    expect(sent).toHaveLength(0);
  });
});
