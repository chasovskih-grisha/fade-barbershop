// Специфікація T-4462: сповіщення про події лояльності — 4 події, канал,
// дедуп, тихі години, добовий ліміт з дайджестом і попередження за 7 днів.
import {
  LoyaltyPointsEarned,
  LoyaltyPointsSpent,
  LoyaltyTierChanged,
} from '../domain/loyalty-events';
import {
  DEFAULT_LOYALTY_NOTIFICATION_CONFIG,
  applyPlanToLog,
  buildLoyaltyIntent,
  createLoyaltyNotificationLog,
  expiryWarningIntent,
  isQuietHour,
  localDayKey,
  planLoyaltyNotifications,
  pointsExpireAt,
  startOfAllowedSendWindow,
  takeDigest,
} from './loyalty-notification-policy';
import {
  LoyaltyNotificationDispatcher,
  renderLoyaltyIntentText,
  type LoyaltyNotificationGateway,
} from './loyalty-notifications';

const config = DEFAULT_LOYALTY_NOTIFICATION_CONFIG;
const NOON_KYIV = new Date('2026-11-19T10:00:00Z'); // 12:00 Europe/Kyiv
const NIGHT_KYIV = new Date('2026-11-19T20:00:00Z'); // 22:00 Europe/Kyiv
const DAY = 24 * 60 * 60 * 1000;

function pointsEarned(points: number, appointmentId: string, at = NOON_KYIV) {
  return new LoyaltyPointsEarned({
    clientId: 'c-1',
    points,
    newBalance: 100 + points,
    appointmentId,
    occurredAt: at,
  });
}

function tierChanged(at = NOON_KYIV) {
  return new LoyaltyTierChanged({
    clientId: 'c-1',
    oldTier: 'bronze',
    newTier: 'silver',
    discountPercent: 5,
    totalVisits: 10,
    occurredAt: at,
  });
}

function fakeGateway() {
  const sent: Array<{ clientId: string; channel: string; text: string }> = [];
  const gateway: LoyaltyNotificationGateway = {
    async send(input) {
      sent.push(input);
    },
  };
  return { sent, gateway };
}

describe('loyalty notification policy (T-4462)', () => {
  it('detects quiet hours and schedules delivery after the window', () => {
    expect(isQuietHour(NIGHT_KYIV, config.quietHours)).toBe(true);
    expect(isQuietHour(new Date('2026-11-19T06:00:00Z'), config.quietHours)).toBe(true);
    expect(isQuietHour(NOON_KYIV, config.quietHours)).toBe(false);

    expect(startOfAllowedSendWindow(NOON_KYIV, config.quietHours)).toEqual(NOON_KYIV);
    expect(startOfAllowedSendWindow(NIGHT_KYIV, config.quietHours)).toEqual(
      new Date('2026-11-20T07:00:00Z') // 09:00 Europe/Kyiv
    );
    expect(localDayKey(NIGHT_KYIV)).toBe('2026-11-19');
  });

  it('maps the significant loyalty events to intents and ignores the rest', () => {
    const earned = buildLoyaltyIntent(pointsEarned(20, 'apt-1'));
    expect(earned).toMatchObject({
      clientId: 'c-1',
      event: 'points_earned',
      points: 20,
      newBalance: 120,
      dedupeKey: 'points_earned:c-1:apt-1',
    });

    const tier = buildLoyaltyIntent(tierChanged());
    expect(tier).toMatchObject({ event: 'tier_reached', tier: 'silver', discountPercent: 5 });

    expect(buildLoyaltyIntent({ type: 'loyalty.other' } as never)).toBeNull();
  });

  it('warns only inside the 7-day expiry window for a positive balance', () => {
    const lastActivity = new Date(NOON_KYIV.getTime() - 358 * DAY);
    const warning = expiryWarningIntent({
      clientId: 'c-1',
      pointsBalance: 40,
      lastActivityAt: lastActivity,
      now: NOON_KYIV,
    });

    expect(warning).toMatchObject({ event: 'points_expiring', points: 40 });
    expect(warning?.expiresAt).toEqual(pointsExpireAt(lastActivity));
    expect(warning?.dedupeKey).toContain('points_expiring:c-1:');

    expect(
      expiryWarningIntent({
        clientId: 'c-1',
        pointsBalance: 40,
        lastActivityAt: new Date(NOON_KYIV.getTime() - 300 * DAY),
        now: NOON_KYIV,
      })
    ).toBeNull();
    expect(
      expiryWarningIntent({
        clientId: 'c-1',
        pointsBalance: 0,
        lastActivityAt: new Date(NOON_KYIV.getTime() - 360 * DAY),
        now: NOON_KYIV,
      })
    ).toBeNull();
    expect(
      expiryWarningIntent({
        clientId: 'c-1',
        pointsBalance: 40,
        lastActivityAt: new Date(NOON_KYIV.getTime() - 370 * DAY),
        now: NOON_KYIV,
      })
    ).toBeNull();
  });

  it('dedupes, respects disabled channels and the daily limit with batching', () => {
    const log = createLoyaltyNotificationLog();
    const intents = [
      buildLoyaltyIntent(pointsEarned(10, 'apt-1'))!,
      buildLoyaltyIntent(pointsEarned(10, 'apt-1'))!,
      buildLoyaltyIntent(tierChanged())!,
      buildLoyaltyIntent(
        new LoyaltyPointsSpent({
          clientId: 'c-1',
          points: 5,
          newBalance: 95,
          appointmentId: 'apt-1',
          occurredAt: NOON_KYIV,
        })
      )!,
    ];

    const plan = planLoyaltyNotifications(intents, log, NOON_KYIV, config);

    expect(plan.deliveries).toHaveLength(1);
    expect(plan.deliveries[0]?.intent.event).toBe('points_earned');
    expect(plan.batched.map((intent) => intent.event)).toEqual(['tier_reached']);
    expect(plan.suppressed.map((entry) => entry.reason)).toEqual([
      'Duplicate notification',
      'Channel disabled for this event',
    ]);

    applyPlanToLog(plan, log, NOON_KYIV);
    expect(takeDigest(log, 'c-1').map((intent) => intent.event)).toEqual(['tier_reached']);
    expect(takeDigest(log, 'c-1')).toEqual([]);
  });

  it('does not count the same client twice for the daily limit', () => {
    const log = createLoyaltyNotificationLog();
    const first = planLoyaltyNotifications(
      [buildLoyaltyIntent(pointsEarned(10, 'apt-1'))!],
      log,
      NOON_KYIV,
      config
    );
    applyPlanToLog(first, log, NOON_KYIV);

    const second = planLoyaltyNotifications(
      [buildLoyaltyIntent(pointsEarned(15, 'apt-2'))!],
      log,
      new Date(NOON_KYIV.getTime() + 3600 * 1000),
      config
    );

    expect(second.deliveries).toHaveLength(0);
    expect(second.batched).toHaveLength(1);
  });
});

describe('LoyaltyNotificationDispatcher (T-4462)', () => {
  function dispatcher(subscribed = true) {
    const { sent, gateway } = fakeGateway();
    return {
      sent,
      service: new LoyaltyNotificationDispatcher(
        gateway,
        { isSubscribed: async () => subscribed },
        config
      ),
    };
  }

  it('renders each of the four events into a client-facing text', () => {
    expect(renderLoyaltyIntentText(buildLoyaltyIntent(pointsEarned(20, 'apt-1'))!)).toContain(
      '+20 балів'
    );
    expect(renderLoyaltyIntentText(buildLoyaltyIntent(tierChanged())!)).toContain('silver');
    expect(
      renderLoyaltyIntentText({
        clientId: 'c-1',
        event: 'points_spent',
        dedupeKey: 'k',
        points: 30,
        newBalance: 70,
      })
    ).toContain('списано 30');
    expect(
      renderLoyaltyIntentText({
        clientId: 'c-1',
        event: 'points_expiring',
        dedupeKey: 'k',
        points: 40,
        expiresAt: new Date('2026-11-25T00:00:00Z'),
      })
    ).toContain('згорять');
  });

  it('sends one notification per day and batches the rest into a digest', async () => {
    const { sent, service } = dispatcher();

    const summary = await service.dispatch(
      [pointsEarned(20, 'apt-1'), tierChanged()],
      NOON_KYIV
    );

    expect(summary.sent).toBe(1);
    expect(summary.batched).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.channel).toBe('push');

    const digest = await service.flushDigest('c-1', NOON_KYIV);
    expect(digest).toEqual({ sent: true, items: 1 });
    expect(sent[1]?.text).toContain('оновлення лояльності');
  });

  it('suppresses everything for an unsubscribed client', async () => {
    const { sent, service } = dispatcher(false);

    const summary = await service.dispatch([pointsEarned(20, 'apt-1')], NOON_KYIV);

    expect(summary.sent).toBe(0);
    expect(summary.unsubscribed).toEqual(['c-1']);
    expect(sent).toHaveLength(0);
  });

  it('defers during quiet hours and delivers after the window closes', async () => {
    const { sent, service } = dispatcher();

    const summary = await service.dispatch([pointsEarned(20, 'apt-1')], NIGHT_KYIV);

    expect(summary).toMatchObject({ sent: 0, deferred: 1 });
    expect(sent).toHaveLength(0);
    expect(service.pendingDeferred()).toBe(1);

    const flush = await service.flushDeferred(new Date('2026-11-19T23:00:00Z'));
    expect(flush).toEqual({ sent: 0, pending: 1 });

    const morning = await service.flushDeferred(new Date('2026-11-20T07:00:00Z'));
    expect(morning).toEqual({ sent: 1, pending: 0 });
    expect(sent).toHaveLength(1);
  });

  it('warns about expiring points once and dedupes the repeated scan', async () => {
    const { sent, service } = dispatcher();
    const states = [
      {
        clientId: 'c-1',
        pointsBalance: 40,
        lastActivityAt: new Date(NOON_KYIV.getTime() - 360 * DAY),
      },
    ];

    const first = await service.planExpiryWarnings(states, NOON_KYIV);
    const second = await service.planExpiryWarnings(states, NOON_KYIV);

    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);
    expect(second.suppressed[0]?.reason).toBe('Duplicate notification');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.channel).toBe('sms');
  });
});
