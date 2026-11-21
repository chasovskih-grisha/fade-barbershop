/* eslint-disable max-lines -- cohesive module (338 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-4459: авто-кампанія «День народження» — вікно, згода,
// підтверджена дата, ліміт «раз на рік», 29 лютого й аудит ручної зміни.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BirthdayCampaignError,
  addDays,
  birthdayOccurrence,
  dayDifference,
  isValidBirthday,
  localDateParts,
  nextBirthdayOccurrence,
  normalizeBirthdayCampaignConfig,
  planBirthdayCampaign,
  renderBirthdayOffer,
  verifyBirthdayDate,
  type BirthdayCampaignClient,
} from '../domain/birthday-campaign';
import {
  BirthdayCampaignService,
  InMemoryBirthdayCampaignClients,
  InMemoryBirthdayCampaignLog,
  type BirthdayCampaignGateway,
} from './birthday-campaign.service';
import { AdminBirthdayCampaignController } from '../infrastructure/birthday-campaign.controller';

const NOW = new Date('2026-11-19T09:00:00Z'); // 11:00 у Києві, 19.11.2026

function client(overrides: Partial<BirthdayCampaignClient> = {}): BirthdayCampaignClient {
  return {
    clientId: 'c-1',
    birthday: { day: 24, month: 11 },
    birthdayConfirmed: true,
    marketingConsent: true,
    ...overrides,
  };
}

function recordingGateway(): BirthdayCampaignGateway & {
  sends: Array<{ clientId: string; channels: string[]; text: string; occurrenceYear: number }>;
} {
  const sends: Array<{
    clientId: string;
    channels: string[];
    text: string;
    occurrenceYear: number;
  }> = [];
  return {
    sends,
    async send(input) {
      sends.push({
        clientId: input.clientId,
        channels: [...input.channels],
        text: input.text,
        occurrenceYear: input.occurrenceYear,
      });
    },
  };
}

describe('birthday campaign policy (T-4459)', () => {
  it('validates the date without a year, allowing 29 February', () => {
    expect(isValidBirthday({ day: 29, month: 2 })).toBe(true);
    expect(isValidBirthday({ day: 31, month: 2 })).toBe(false);
    expect(isValidBirthday({ day: 31, month: 4 })).toBe(false);
    expect(isValidBirthday({ day: 0, month: 5 })).toBe(false);
    expect(isValidBirthday({ day: 15, month: 13 })).toBe(false);
    expect(isValidBirthday({ day: 15.5, month: 5 })).toBe(false);
  });

  it('moves 29 February to 28 February in a non-leap year and keeps it in a leap year', () => {
    expect(birthdayOccurrence({ day: 29, month: 2 }, 2026)).toEqual({
      year: 2026,
      month: 2,
      day: 28,
    });
    expect(birthdayOccurrence({ day: 29, month: 2 }, 2028)).toEqual({
      year: 2028,
      month: 2,
      day: 29,
    });
  });

  it('reads local date parts in the campaign time zone and does date arithmetic', () => {
    const lateUtc = new Date('2026-11-19T22:30:00Z'); // уже 20.11 у Києві
    expect(localDateParts(lateUtc, 'Europe/Kyiv')).toEqual({
      year: 2026,
      month: 11,
      day: 20,
      hour: 0,
    });

    const today = { year: 2026, month: 12, day: 30 };
    expect(addDays(today, 3)).toEqual({ year: 2027, month: 1, day: 2 });
    expect(dayDifference(today, { year: 2027, month: 1, day: 2 })).toBe(3);
  });

  it('finds the next occurrence, rolling over to next year after the birthday', () => {
    const today = localDateParts(NOW);
    expect(nextBirthdayOccurrence({ day: 19, month: 11 }, today)).toEqual({
      occurrence: { year: 2026, month: 11, day: 19 },
      daysUntil: 0,
    });
    expect(nextBirthdayOccurrence({ day: 18, month: 11 }, today)).toEqual({
      occurrence: { year: 2027, month: 11, day: 18 },
      daysUntil: 364,
    });
  });

  it('normalizes the config and rejects impossible settings', () => {
    const config = normalizeBirthdayCampaignConfig({ leadDays: 3, channels: ['sms', 'email'] });
    expect(config.leadDays).toBe(3);
    expect(config.channels).toEqual(['sms', 'email']);

    expect(() => normalizeBirthdayCampaignConfig({ leadDays: -1 })).toThrow(BirthdayCampaignError);
    expect(() => normalizeBirthdayCampaignConfig({ discountPercent: 0 })).toThrow(
      'discountPercent'
    );
    expect(() => normalizeBirthdayCampaignConfig({ validDays: 0 })).toThrow('validDays');
    expect(() => normalizeBirthdayCampaignConfig({ channels: [] })).toThrow('channel');
    expect(() => normalizeBirthdayCampaignConfig({ channels: ['sms', 'sms'] })).toThrow('unique');
    expect(() => normalizeBirthdayCampaignConfig({ maxPerClientPerYear: 0 })).toThrow(
      'maxPerClientPerYear'
    );
  });

  it('plans an offer inside the lead window with discount, channels and expiry', () => {
    const plan = planBirthdayCampaign({ clients: [client()], now: NOW });

    expect(plan.suppressed).toEqual([]);
    expect(plan.offers).toHaveLength(1);
    const offer = plan.offers[0];
    if (!offer) throw new Error('expected birthday offer');
    expect(offer?.clientId).toBe('c-1');
    expect(offer?.daysUntil).toBe(5);
    expect(offer?.occurrenceYear).toBe(2026);
    expect(offer?.fingerprint).toBe('birthday:c-1:2026');
    expect(offer?.discountPercent).toBe(15);
    expect(offer?.channels).toEqual(['sms']);
    expect(offer?.validUntil).toEqual({ year: 2026, month: 12, day: 8 });
    expect(offer?.text).toBe(
      renderBirthdayOffer({ discountPercent: 15, validUntil: offer.validUntil })
    );
    expect(offer?.text).toContain('15%');
    expect(offer?.text).toContain('08.12.2026');
  });

  it('suppresses clients outside the window, without consent or with an unconfirmed date', () => {
    const plan = planBirthdayCampaign({
      clients: [
        client({ clientId: 'far', birthday: { day: 30, month: 11 } }),
        client({ clientId: 'no-consent', marketingConsent: false }),
        client({ clientId: 'unconfirmed', birthdayConfirmed: false }),
        client({ clientId: 'no-date', birthday: null }),
        client({ clientId: 'bad-date', birthday: { day: 31, month: 2 } }),
      ],
      now: NOW,
    });

    expect(plan.offers).toEqual([]);
    expect(plan.suppressed).toEqual([
      { clientId: 'far', reason: 'outside_window' },
      { clientId: 'no-consent', reason: 'no_marketing_consent' },
      { clientId: 'unconfirmed', reason: 'date_unconfirmed' },
      { clientId: 'no-date', reason: 'no_birthday' },
      { clientId: 'bad-date', reason: 'no_birthday' },
    ]);
  });

  it('sends one offer per client per year and allows the next year', () => {
    const first = planBirthdayCampaign({ clients: [client()], now: NOW });
    const fingerprint = first.offers[0]?.fingerprint ?? '';

    const repeat = planBirthdayCampaign({
      clients: [client()],
      now: NOW,
      offeredFingerprints: new Set([fingerprint]),
    });
    expect(repeat.offers).toEqual([]);
    expect(repeat.suppressed).toEqual([{ clientId: 'c-1', reason: 'already_offered' }]);

    const nextYear = planBirthdayCampaign({
      clients: [client()],
      now: new Date('2027-11-19T09:00:00Z'),
      offeredFingerprints: new Set([fingerprint]),
    });
    expect(nextYear?.offers?.[0]?.fingerprint).toBe('birthday:c-1:2027');
  });

  it('respects a disabled campaign and a custom lead window', () => {
    const disabled = planBirthdayCampaign({
      clients: [client()],
      now: NOW,
      config: normalizeBirthdayCampaignConfig({ enabled: false }),
    });
    expect(disabled.offers).toEqual([]);
    expect(disabled.suppressed).toEqual([{ clientId: 'c-1', reason: 'campaign_disabled' }]);

    const narrow = planBirthdayCampaign({
      clients: [client()],
      now: NOW,
      config: normalizeBirthdayCampaignConfig({ leadDays: 3 }),
    });
    expect(narrow.suppressed).toEqual([{ clientId: 'c-1', reason: 'outside_window' }]);
  });

  it('greets 29 February clients on 28 February when the year is not leap', () => {
    const plan = planBirthdayCampaign({
      clients: [client({ birthday: { day: 29, month: 2 } })],
      now: new Date('2027-02-25T09:00:00Z'),
    });
    expect(plan?.offers?.[0]?.daysUntil).toBe(3);
    expect(plan?.offers?.[0]?.validUntil).toEqual({ year: 2027, month: 3, day: 14 });
  });

  it('records an audited date change and rejects invalid authors or dates', () => {
    const entry = verifyBirthdayDate({
      clientId: 'c-1',
      birthday: { day: 29, month: 2 },
      previous: { day: 1, month: 3 },
      by: 'admin-1',
      at: NOW,
    });
    expect(entry).toEqual({
      clientId: 'c-1',
      at: NOW,
      by: 'admin-1',
      source: 'admin',
      from: { day: 1, month: 3 },
      to: { day: 29, month: 2 },
    });

    expect(() =>
      verifyBirthdayDate({
        clientId: 'c-1',
        birthday: { day: 30, month: 2 },
        previous: null,
        by: 'admin-1',
        at: NOW,
      })
    ).toThrow('Invalid birthday');
    expect(() =>
      verifyBirthdayDate({
        clientId: 'c-1',
        birthday: { day: 1, month: 3 },
        previous: null,
        by: '   ',
        at: NOW,
      })
    ).toThrow('Author');
  });
});

describe('BirthdayCampaignService (T-4459)', () => {
  function setup(seed: BirthdayCampaignClient[] = [client()]) {
    const clients = new InMemoryBirthdayCampaignClients(seed);
    const gateway = recordingGateway();
    const log = new InMemoryBirthdayCampaignLog();
    let now = NOW;
    const service = new BirthdayCampaignService(clients, gateway, log, {
      now: () => now,
    });
    return { clients, gateway, log, service, setNow: (value: Date) => (now = value) };
  }

  it('previews without sending and reports the same plan on run', async () => {
    const { gateway, service } = setup();

    const preview = await service.preview();
    expect(preview.offers).toHaveLength(1);
    expect(gateway.sends).toEqual([]);

    const summary = await service.run();
    expect(summary.sent).toBe(1);
    expect(summary.offers).toHaveLength(1);
    expect(gateway.sends).toEqual([
      {
        clientId: 'c-1',
        channels: ['sms'],
        text: preview?.offers?.[0]?.text,
        occurrenceYear: 2026,
      },
    ]);
  });

  it('never sends twice in the same year, even across restarts of the run', async () => {
    const { gateway, service, setNow } = setup();

    expect((await service.run()).sent).toBe(1);
    expect((await service.run()).sent).toBe(0);
    expect(gateway.sends).toHaveLength(1);

    setNow(new Date('2026-11-23T09:00:00Z'));
    expect((await service.run()).sent).toBe(0);

    setNow(new Date('2027-11-18T09:00:00Z'));
    expect((await service.run()).sent).toBe(1);
    expect(gateway.sends.map((send) => send.occurrenceYear)).toEqual([2026, 2027]);
  });

  it('keeps delivery and audit history with the resolved config', async () => {
    const { service } = setup();
    await service.run();
    await service.verifyDate({ clientId: 'c-1', birthday: { day: 25, month: 11 }, by: 'admin-1' });

    const history = service.history();
    expect(history.deliveries).toHaveLength(1);
    expect(history?.deliveries?.[0]?.year).toBe(2026);
    expect(history.audits).toHaveLength(1);
    expect(history?.audits?.[0]?.from).toEqual({ day: 24, month: 11 });
    expect(history.config.leadDays).toBe(7);
  });

  it('verifies a date, marks it confirmed and allows the offer afterwards', async () => {
    const { clients, service } = setup([client({ birthdayConfirmed: false })]);
    expect((await service.preview()).offers).toEqual([]);

    const result = await service.verifyDate({
      clientId: 'c-1',
      birthday: { day: 24, month: 11 },
      by: 'admin-1',
      at: NOW,
    });
    expect(result.client.birthdayConfirmed).toBe(true);
    expect(result.audit.source).toBe('admin');
    expect((await clients.get('c-1'))?.birthdayConfirmed).toBe(true);
    expect((await service.preview()).offers).toHaveLength(1);
  });

  it('reports an unknown client and refuses an invalid date', async () => {
    const { service } = setup();
    await expect(
      service.verifyDate({ clientId: 'missing', birthday: { day: 1, month: 5 }, by: 'admin-1' })
    ).rejects.toThrow('not found');
    await expect(
      service.verifyDate({ clientId: 'c-1', birthday: { day: 31, month: 2 }, by: 'admin-1' })
    ).rejects.toThrow(BirthdayCampaignError);
  });
});

describe('AdminBirthdayCampaignController (T-4459)', () => {
  function setup() {
    const clients = new InMemoryBirthdayCampaignClients([client()]);
    const gateway = recordingGateway();
    const log = new InMemoryBirthdayCampaignLog();
    const service = new BirthdayCampaignService(clients, gateway, log, { now: () => NOW });
    return { controller: new AdminBirthdayCampaignController(service), gateway, service };
  }

  it('serves preview, run, history and the date verification', async () => {
    const { controller, gateway } = setup();

    const preview = await controller.preview(NOW.toISOString());
    expect(preview.offers).toHaveLength(1);

    const run = await controller.run({ at: NOW.toISOString() });
    expect(run.sent).toBe(1);
    expect(gateway.sends).toHaveLength(1);

    const history = controller.history();
    expect(history.deliveries).toHaveLength(1);

    const verified = await controller.setDate('c-1', {
      day: 29,
      month: 2,
      by: 'admin-1',
      at: NOW.toISOString(),
    });
    expect(verified.birthday).toEqual({ day: 29, month: 2 });
    expect(verified.audit.from).toEqual({ day: 24, month: 11 });
  });

  it('maps an unknown client to 404 and bad input to 400', async () => {
    const { controller } = setup();

    await expect(
      controller.setDate('missing', { day: 1, month: 5, by: 'admin-1' })
    ).rejects.toThrow(NotFoundException);
    await expect(controller.setDate('c-1', { day: 31, month: 2, by: 'admin-1' })).rejects.toThrow(
      BadRequestException
    );
    await expect(controller.preview('not-a-date')).rejects.toThrow(BadRequestException);
  });
});
