// T-4462: сповіщення про події лояльності — HTTP-поверхня.
// Ендпоінти: POST /admin/loyalty-notifications/dispatch — розштовхни пачку подій,
// POST /admin/loyalty-notifications/flush-deferred — відправ кладнаті сповіщення,
// POST /admin/loyalty-notifications/flush-digest/:clientId — дайджест для клієнта.

import { Body, Controller, Post, Param } from '@nestjs/common';
import { LoyaltyNotificationDispatcher } from './application/loyalty-notifications';
import type { DomainEvent } from './domain/domain-event';

@Controller('admin/loyalty-notifications')
export class LoyaltyNotificationController {
  constructor(private readonly dispatcher: LoyaltyNotificationDispatcher) {}

  /** Розштовхни пачку подій лояльності (SMS + push). */
  @Post('dispatch')
  async dispatch(@Body() events: DomainEvent[]): Promise<{
    sent: number;
    deferred: number;
    batched: number;
    suppressed: Array<{ clientId: string; event: string; reason: string }>;
    unsubscribed: string[];
  }> {
    const now = new Date();
    return this.dispatcher.dispatch(events, now);
  }

  /** Відправляє відкладені (після тихих годин) сповіщення. */
  @Post('flush-deferred')
  async flushDeferred(): Promise<{ sent: number; pending: number }> {
    const now = new Date();
    return this.dispatcher.flushDeferred(now);
  }

  /** Дайджест сповіщень для клієнта (більше 1 події згортається в одну SMS). */
  @Post('flush-digest/:clientId')
  async flushDigest(
    @Param('clientId') clientId: string
  ): Promise<{ sent: boolean; items: number }> {
    const now = new Date();
    return this.dispatcher.flushDigest(clientId, now);
  }
}
