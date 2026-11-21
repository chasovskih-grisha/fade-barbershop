// Політика доставки web push (T-4449): дедуп між поверхнями, тихі години, згода.
import {
  dedupeBySession,
  isQuietHour,
  planPushDelivery,
  type PushSubscriptionRef,
} from './web-push-delivery-policy';

const quiet = { fromMinutes: 22 * 60, toMinutes: 8 * 60 };

describe('web-push-delivery-policy (T-4449)', () => {
  it('доставляє, коли згода є і тихих годин немає', () => {
    const subs: PushSubscriptionRef[] = [{ surface: 'web', sessionId: 's1' }];
    const decision = planPushDelivery({
      consent: true,
      nowMinutes: 600,
      quietHours: quiet,
      subscriptions: subs,
    });

    expect(decision).toEqual({ deliver: true, targets: subs, reason: 'delivered' });
  });

  it('відмова в згоді блокує доставку', () => {
    const decision = planPushDelivery({
      consent: false,
      nowMinutes: 600,
      quietHours: quiet,
      subscriptions: [{ surface: 'web', sessionId: 's1' }],
    });

    expect(decision).toEqual({ deliver: false, targets: [], reason: 'no-consent' });
  });

  it('тихі години з заворотом через північ блокують доставку', () => {
    expect(isQuietHour(23 * 60, quiet)).toBe(true);
    expect(isQuietHour(3 * 60, quiet)).toBe(true);
    expect(isQuietHour(9 * 60, quiet)).toBe(false);

    const decision = planPushDelivery({
      consent: true,
      nowMinutes: 23 * 60,
      quietHours: quiet,
      subscriptions: [{ surface: 'web', sessionId: 's1' }],
    });
    expect(decision.reason).toBe('quiet-hours');
  });

  it('одна сесія на двох поверхнях дає один доставлений пуш', () => {
    const subs: PushSubscriptionRef[] = [
      { surface: 'web', sessionId: 's1' },
      { surface: 'mobile', sessionId: 's1' },
    ];

    expect(dedupeBySession(subs)).toEqual([{ surface: 'mobile', sessionId: 's1' }]);
  });

  it('різні сесії лишаються окремими цілями', () => {
    const subs: PushSubscriptionRef[] = [
      { surface: 'mobile', sessionId: 's1' },
      { surface: 'mobile', sessionId: 's2' },
    ];

    expect(dedupeBySession(subs)).toHaveLength(2);
  });

  it('без підписок доставки немає', () => {
    const decision = planPushDelivery({
      consent: true,
      nowMinutes: 600,
      quietHours: quiet,
      subscriptions: [],
    });

    expect(decision).toEqual({ deliver: false, targets: [], reason: 'no-subscriptions' });
  });
});
