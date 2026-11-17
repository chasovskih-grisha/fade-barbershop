import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import { LoyaltyCounterAdjusted } from '../domain/loyalty-events';

export interface AdjustLoyaltyCounterInput {
  clientId: string;
  newCount: number;
  reason: string;
  adjustedBy: string;
  occurredAt: Date;
}

export class AdjustLoyaltyCounterHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: AdjustLoyaltyCounterInput): Promise<{
    clientId: string;
    oldCount: number;
    newCount: number;
    hasFreeVisit: boolean;
  }> {
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, input.occurredAt);
    }

    const oldCount = state.counter;
    state.adjustCounter(input.newCount, input.occurredAt);

    await this.ctx.states.save(state);

    await this.ctx.outbox.append([
      new LoyaltyCounterAdjusted({
        clientId: state.clientId,
        oldCount,
        newCount: state.counter,
        reason: input.reason,
        adjustedBy: input.adjustedBy,
        occurredAt: input.occurredAt,
      }),
    ]);

    return {
      clientId: state.clientId,
      oldCount,
      newCount: state.counter,
      hasFreeVisit: state.hasFreeVisit,
    };
  }
}
