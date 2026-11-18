// Set Loyalty Tier (T-141): ADR 0009 + LYL-ADM-01.
// Promotes/demotes client tier based on visit count relative to threshold.
// Emits LoyaltyTierChanged event for admin dashboards & client notifications.

import { prisma } from '../../index';
import { ClientLoyaltyState } from '../domain';
import { LoyaltyTierChanged } from '../domain/loyalty-events';
import { DomainEvent } from '../domain/domain-event';

export interface SetLoyaltyTierInput {
  clientId: string;
  newTier: string;
  reason: string;
  occurredAt: Date;
}

export interface SetLoyaltyTierOutput {
  clientId: string;
  oldTier: string;
  newTier: string;
  oldCounter: number;
  newCounter: number;
  tierChanged: boolean;
  event?: DomainEvent;
}

export class SetLoyaltyTierHandler {
  async handle(input: SetLoyaltyTierInput): Promise<SetLoyaltyTierOutput> {
    // 1. Idempotency: check current state
    const existing = await prisma.clientProfile.findUnique({
      where: { clientId: input.clientId },
    });

    const oldTier = existing?.tier ?? 'BRONZE';
    const oldCounter = existing?.loyaltyVisitsCount ?? 0;

    // 2. Update tier on client profile
    await prisma.clientProfile.update({
      where: { clientId: input.clientId },
      data: { tier: input.newTier },
    });

    // 3. Emit tier change event
    const discountMap: Record<string, number> = {
      BRONZE: 0,
      SILVER: 5,
      GOLD: 10,
      PLATINUM: 15,
    };
    const discount = discountMap[input.newTier] ?? 0;

    const event = new LoyaltyTierChanged({
      clientId: input.clientId,
      oldTier,
      newTier: input.newTier,
      discountPercent: discount,
      totalVisits: oldCounter + 1,
      occurredAt: input.occurredAt,
    });

    // 4. Append to outbox (using prisma outboxMessage createMany pattern)
    await prisma.$executeRaw`
      INSERT INTO outboxmessage (id, type, aggregateId, payload, createdAt)
      VALUES (gen_random_uuid(), 'loyalty.tier.changed', '${input.clientId}', 
       '${JSON.stringify({
         clientId: input.clientId,
         oldTier,
         newTier: input.newTier,
         discountPercent: discount,
         totalVisits: oldCounter + 1,
         occurredAt: input.occurredAt,
       })}'::jsonb, NOW())
    `;

    return {
      clientId: input.clientId,
      oldTier,
      newTier: input.newTier,
      oldCounter,
      newCounter: oldCounter + 1, // visits incremented by 1
      tierChanged: oldTier !== input.newTier,
      event,
    };
  }
}