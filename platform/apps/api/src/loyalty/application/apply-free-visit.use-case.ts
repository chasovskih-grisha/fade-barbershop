import type { LoyaltyCommandContext } from '../domain/ports';
import { FreeVisitApplied } from '../domain/loyalty-events';

export interface ApplyFreeVisitInput {
  clientId: string;
  appointmentId: string;
  occurredAt: Date;
}

export class ApplyFreeVisitHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: ApplyFreeVisitInput): Promise<{ applied: boolean }> {
    const state = await this.ctx.states.findByClientId(input.clientId);
    if (!state || !state.hasFreeVisit) {
      return { applied: false };
    }

    const applied = state.applyFreeVisit(input.appointmentId, input.occurredAt);
    if (!applied) {
      return { applied: false };
    }

    await this.ctx.states.save(state);
    await this.ctx.outbox.append([
      new FreeVisitApplied({
        clientId: state.clientId,
        appointmentId: input.appointmentId,
        occurredAt: input.occurredAt,
      }),
    ]);

    return { applied: true };
  }
}
