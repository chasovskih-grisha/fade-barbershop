import { LoyaltyNotificationHandler } from './loyalty-notification';
import type { LoyaltyNotificationDeps, LoyaltyNotificationEvent } from './loyalty-notification-ports';

describe('LoyaltyNotificationHandler (T-4462)', () => {
  it('sends SMS and push when loyalty counter is incremented', async () => {
    const sentSms: any[] = [];
    const sentPush: any[] = [];
    const journalRecords: any[] = [];

    const deps: LoyaltyNotificationDeps = {
      sms: {
        async send(msg) {
          sentSms.push(msg);
        },
      },
      push: {
        async send(msg) {
          sentPush.push(msg);
        },
      },
      clients: {
        async findPhoneByClientId(_clientId: string) {
          return '+380501234567';
        },
      } as any,
      devices: {
        async findTokensByUserId(_userId: string) {
          return ['ExponentPushToken[123]'];
        },
      } as any,
      journal: {
        async alreadyHandled(_id) {
          return false;
        },
        async markSent(record) {
          journalRecords.push(record);
        },
      },
    };

    const handler = new LoyaltyNotificationHandler(deps);
    const event: LoyaltyNotificationEvent = {
      id: 'evt-loyalty-1',
      aggregateId: 'client-1',
      type: 'loyalty.counter.incremented',
      payload: { clientId: 'client-1', oldCount: 2, newCount: 3, appointmentId: 'apt-1' },
    };

    const outcome = await handler.handleOne(event);
    expect(outcome).toEqual({ handled: true, reason: 'sent' });
    expect(sentSms.length).toBe(1);
    expect(sentSms[0].text).toContain('3/6');
    expect(sentPush.length).toBe(1);
    expect(journalRecords[0].channel).toBe('sms+push');
  });

  it('handles duplicate events gracefully', async () => {
    const deps: LoyaltyNotificationDeps = {
      sms: { async send() {} },
      push: { async send() {} },
      clients: { async findPhoneByClientId() { return null; } } as any,
      devices: { async findTokensByUserId() { return []; } } as any,
      journal: {
        async alreadyHandled(_id) {
          return true;
        },
        async markSent() {},
      },
    };

    const handler = new LoyaltyNotificationHandler(deps);
    const event: LoyaltyNotificationEvent = {
      id: 'evt-dup',
      aggregateId: 'client-1',
      type: 'loyalty.free_visit.granted',
      payload: { clientId: 'client-1', counter: 6 },
    };

    const outcome = await handler.handleOne(event);
    expect(outcome).toEqual({ handled: false, reason: 'duplicate' });
  });

  it('skips loyalty notification when client has opted out', async () => {
    const journalRecords: any[] = [];
    const deps: LoyaltyNotificationDeps = {
      sms: { async send() {} },
      push: { async send() {} },
      clients: { async findPhoneByClientId() { return '+380501234567'; } } as any,
      devices: { async findTokensByUserId() { return ['token']; } } as any,
      preferences: {
        async isOptedOut(_clientId: string) {
          return true;
        },
      },
      journal: {
        async alreadyHandled(_id: string) { return false; },
        async markSent(record) { journalRecords.push(record); },
      },
    };

    const handler = new LoyaltyNotificationHandler(deps);
    const event: LoyaltyNotificationEvent = {
      id: 'evt-optout',
      aggregateId: 'client-opted-out',
      type: 'loyalty.counter.incremented',
      payload: { clientId: 'client-opted-out', newCount: 1 },
    };

    const outcome = await handler.handleOne(event);
    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(journalRecords[0].detail).toContain('відписався');
  });
});
