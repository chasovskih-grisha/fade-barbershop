import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import {
  FreeVisitGranted,
  FreeVisitUsed,
  LoyaltyCounterIncremented,
  LoyaltyTierChanged,
} from '../domain/loyalty-events';
import { DomainEvent } from '../domain/domain-event';
import { determineLoyaltyTier, DEFAULT_LOYALTY_TIERS } from '../domain/loyalty-tier';

export interface ProcessAppointmentCompletedInput {
  clientId: string;
  appointmentId: string;
  wasFreeVisit?: boolean;
  occurredAt: Date;
}

export class ProcessAppointmentCompletedHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: ProcessAppointmentCompletedInput): Promise<{
    clientId: string;
    counter: number;
    hasFreeVisit: boolean;
  }> {
    const threshold = this.ctx.threshold ?? 7;
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, input.occurredAt);
    }

    if (state.isProcessed(input.appointmentId)) {
      return {
        clientId: state.clientId,
        counter: state.counter,
        hasFreeVisit: state.hasFreeVisit,
      };
    }

    const oldCount = state.counter;
    const { granted, used, incremented } = state.processCompletedAppointment(
      input.appointmentId,
      threshold,
      input.wasFreeVisit ?? false,
      input.occurredAt
    );

    await this.ctx.states.save(state);

    const events: DomainEvent[] = [];
    if (used) {
      events.push(
        new FreeVisitUsed({
          clientId: state.clientId,
          appointmentId: input.appointmentId,
          occurredAt: input.occurredAt,
        })
      );
    } else if (incremented) {
      events.push(
        new LoyaltyCounterIncremented({
          clientId: state.clientId,
          oldCount,
          newCount: state.counter,
          appointmentId: input.appointmentId,
          occurredAt: input.occurredAt,
        })
      );
    }

    if (granted) {
      events.push(
        new FreeVisitGranted({
          clientId: state.clientId,
          counter: threshold,
          occurredAt: input.occurredAt,
        })
      );
    }

    // Evaluate and upgrade loyalty tier after appointment completion
    const currentTier = determineLoyaltyTier(state.counter, DEFAULT_LOYALTY_TIERS);
    const oldTier = state.tier;
    const upgraded = oldTier !== currentTier.level;

    if (upgraded) {
      state.setTier(currentTier.level, input.occurredAt);
      await this.ctx.states.save(state);
      events.push(
        new LoyaltyTierChanged({
          clientId: input.clientId,
          oldTier,
          newTier: currentTier.level,
          discountPercent: currentTier.discountPercent,
          totalVisits: state.counter,
          occurredAt: input.occurredAt,
        })
      );
    }

    if (events.length > 0) {
      await this.ctx.outbox.append(events);
    }

    return {
      clientId: state.clientId,
      counter: state.counter,
      hasFreeVisit: state.hasFreeVisit,
      tier: currentTier.level,
      discountPercent: currentTier.discountPercent,
    };
  }
}
