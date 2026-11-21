/* eslint-disable max-lines, complexity -- cohesive module (217 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: renderLoyaltyIntentText, complexity 26 vs 10); refactor tracked in T-2500f */
/**
 * T-4462: доставка сповіщень про події лояльності.
 *
 * Правила — у loyalty-notification-policy (дедуп, тихі години, добовий ліміт,
 * попередження про згорання). Тут лише порти (канал, згода клієнта) і
 * послідовність: зняти наміри з подій → перевірити підписку → відправити
 * зараз, відкласти на кінець тихих годин або зібрати в дайджест.
 */
import type { DomainEvent } from '../domain/domain-event';
import {
  clampToSmsLimit,
  renderLoyaltyDigestSms,
  renderLoyaltyPointsEarnedEmail,
  renderLoyaltyPointsEarnedSms,
  renderLoyaltyPointsExpiringEmail,
  renderLoyaltyPointsExpiringSms,
  renderLoyaltyPointsSpentEmail,
  renderLoyaltyPointsSpentSms,
  renderLoyaltyTierReachedEmail,
  renderLoyaltyTierReachedSms,
} from '../../notifications/application/sms-messages';
import {
  DEFAULT_LOYALTY_NOTIFICATION_CONFIG,
  applyPlanToLog,
  buildLoyaltyIntent,
  createLoyaltyNotificationLog,
  expiryWarningIntent,
  planLoyaltyNotifications,
  takeDigest,
  type LoyaltyNotificationConfig,
  type LoyaltyNotificationIntent,
  type LoyaltyNotificationLogState,
  type PlannedDelivery,
} from './loyalty-notification-policy';

export type LoyaltyDeliveryChannel = 'sms' | 'push' | 'email';

/** Канал доставки (SMS-шлюз, push-шлюз, email — рішення інфраструктури). */
export interface LoyaltyNotificationGateway {
  send(input: { clientId: string; channel: LoyaltyDeliveryChannel; text: string }): Promise<void>;
}

/** Чи не відписався клієнт від сповіщень лояльності. */
export interface LoyaltyNotificationPreferences {
  isSubscribed(clientId: string): Promise<boolean>;
}

export interface LoyaltyDispatchSummary {
  sent: number;
  deferred: number;
  batched: number;
  suppressed: Array<{ clientId: string; event: string; reason: string }>;
  unsubscribed: string[];
}

/** Текст сповіщення для конкретного наміру й каналу. */
export function renderLoyaltyIntentText(
  intent: LoyaltyNotificationIntent,
  channel: LoyaltyDeliveryChannel = 'sms'
): string {
  if (channel === 'email') {
    switch (intent.event) {
      case 'points_earned':
        return renderLoyaltyPointsEarnedEmail({
          points: intent.points ?? 0,
          newBalance: intent.newBalance ?? 0,
        });
      case 'tier_reached':
        return renderLoyaltyTierReachedEmail({
          tier: intent.tier ?? '',
          discountPercent: intent.discountPercent ?? 0,
        });
      case 'points_spent':
        return renderLoyaltyPointsSpentEmail({
          points: intent.points ?? 0,
          newBalance: intent.newBalance ?? 0,
        });
      case 'points_expiring':
        return renderLoyaltyPointsExpiringEmail({
          points: intent.points ?? 0,
          expiresAt: intent.expiresAt ?? new Date(),
        });
    }
  }

  switch (intent.event) {
    case 'points_earned':
      return renderLoyaltyPointsEarnedSms({
        points: intent.points ?? 0,
        newBalance: intent.newBalance ?? 0,
      });
    case 'tier_reached':
      return renderLoyaltyTierReachedSms({
        tier: intent.tier ?? '',
        discountPercent: intent.discountPercent ?? 0,
      });
    case 'points_spent':
      return renderLoyaltyPointsSpentSms({
        points: intent.points ?? 0,
        newBalance: intent.newBalance ?? 0,
      });
    case 'points_expiring':
      return renderLoyaltyPointsExpiringSms({
        points: intent.points ?? 0,
        expiresAt: intent.expiresAt ?? new Date(),
      });
  }
}

/** Один рядок дайджесту — короткий опис події без повторів. */
export function digestLine(intent: LoyaltyNotificationIntent): string {
  const text = renderLoyaltyIntentText(intent);
  return text.replace(/^FADE:\s*/, '');
}

export class LoyaltyNotificationDispatcher {
  private readonly log: LoyaltyNotificationLogState = createLoyaltyNotificationLog();
  private readonly deferred = new Map<string, PlannedDelivery[]>();

  constructor(
    private readonly gateway: LoyaltyNotificationGateway,
    private readonly preferences: LoyaltyNotificationPreferences,
    private readonly config: LoyaltyNotificationConfig = DEFAULT_LOYALTY_NOTIFICATION_CONFIG
  ) {}

  /** Обробляє пачку доменних подій лояльності. */
  async dispatch(events: DomainEvent[], now: Date = new Date()): Promise<LoyaltyDispatchSummary> {
    const intents = events
      .map((event) => buildLoyaltyIntent(event))
      .filter((intent): intent is LoyaltyNotificationIntent => intent !== null);

    return this.dispatchIntents(intents, now);
  }

  /** Попередження про згорання балів (за 7 днів до кінця строку). */
  async planExpiryWarnings(
    states: Array<{ clientId: string; pointsBalance: number; lastActivityAt: Date }>,
    now: Date = new Date()
  ): Promise<LoyaltyDispatchSummary> {
    const intents = states
      .map((state) =>
        expiryWarningIntent({
          clientId: state.clientId,
          pointsBalance: state.pointsBalance,
          lastActivityAt: state.lastActivityAt,
          now,
          config: this.config,
        })
      )
      .filter((intent): intent is LoyaltyNotificationIntent => intent !== null);

    return this.dispatchIntents(intents, now);
  }

  private async dispatchIntents(
    intents: LoyaltyNotificationIntent[],
    now: Date
  ): Promise<LoyaltyDispatchSummary> {
    const summary: LoyaltyDispatchSummary = {
      sent: 0,
      deferred: 0,
      batched: 0,
      suppressed: [],
      unsubscribed: [],
    };

    const subscribed: LoyaltyNotificationIntent[] = [];
    const checked = new Set<string>();
    for (const intent of intents) {
      if (!checked.has(intent.clientId)) {
        checked.add(intent.clientId);
        const allowed = await this.preferences.isSubscribed(intent.clientId);
        if (!allowed) {
          summary.unsubscribed.push(intent.clientId);
          continue;
        }
      }
      if (!summary.unsubscribed.includes(intent.clientId)) subscribed.push(intent);
    }

    const plan = planLoyaltyNotifications(subscribed, this.log, now, this.config);
    applyPlanToLog(plan, this.log, now, this.config.timeZone);

    for (const delivery of plan.deliveries) {
      if (delivery.scheduledFor.getTime() > now.getTime()) {
        // Тихі години: не шлемо зараз — чекаємо кінця вікна.
        summary.deferred += 1;
        const queue = this.deferred.get(delivery.intent.clientId) ?? [];
        queue.push(delivery);
        this.deferred.set(delivery.intent.clientId, queue);
        continue;
      }
      await this.deliver(delivery, now);
      summary.sent += 1;
    }

    summary.batched = plan.batched.length;
    summary.suppressed = plan.suppressed.map((entry) => ({
      clientId: entry.intent.clientId,
      event: entry.intent.event,
      reason: entry.reason,
    }));

    return summary;
  }

  /** Відправляє відкладені (після тихих годин) сповіщення. */
  async flushDeferred(now: Date = new Date()): Promise<{ sent: number; pending: number }> {
    let sent = 0;
    let pending = 0;

    for (const [clientId, queue] of [...this.deferred.entries()]) {
      const remaining: PlannedDelivery[] = [];
      for (const delivery of queue) {
        if (delivery.scheduledFor.getTime() <= now.getTime()) {
          await this.deliver(delivery, now);
          sent += 1;
        } else {
          remaining.push(delivery);
        }
      }
      if (remaining.length > 0) this.deferred.set(clientId, remaining);
      else this.deferred.delete(clientId);
      pending += remaining.length;
    }

    return { sent, pending };
  }

  /** Один дайджест замість кількох пушів понад добовий ліміт. */
  async flushDigest(
    clientId: string,
    now: Date = new Date()
  ): Promise<{ sent: boolean; items: number }> {
    const intents = takeDigest(this.log, clientId);
    if (intents.length === 0) return { sent: false, items: 0 };

    const first = intents[0];
    if (!first) return { sent: false, items: 0 };
    const configured = this.config.channels[first.event];
    const channel: LoyaltyDeliveryChannel = configured === 'none' ? 'sms' : configured;
    const text = clampToSmsLimit(
      renderLoyaltyDigestSms(intents.map((intent) => digestLine(intent)))
    );

    await this.deliver({ intent: first, channel, scheduledFor: now }, now, text);
    return { sent: true, items: intents.length };
  }

  /** Скільки сповіщень чекає на кінець тихих годин. */
  pendingDeferred(): number {
    return [...this.deferred.values()].reduce((total, queue) => total + queue.length, 0);
  }

  private async deliver(delivery: PlannedDelivery, _now: Date, text?: string): Promise<void> {
    await this.gateway.send({
      clientId: delivery.intent.clientId,
      channel: delivery.channel,
      text: text ?? renderLoyaltyIntentText(delivery.intent, delivery.channel),
    });
  }
}
