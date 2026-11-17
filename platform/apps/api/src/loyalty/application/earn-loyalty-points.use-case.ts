import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import { LoyaltyPointsEarned } from '../domain/loyalty-events';

export interface EarnLoyaltyPointsInput {
  clientId: string;
  amountPaid: number;
  tierMultiplier?: number;
  appointmentId?: string;
  occurredAt?: Date;
}

export interface EarnLoyaltyPointsResult {
  clientId: string;
  pointsEarned: number;
  newBalance: number;
}

export class EarnLoyaltyPointsHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: EarnLoyaltyPointsInput): Promise<EarnLoyaltyPointsResult> {
    const now = input.occurredAt ?? this.ctx.clock.now();
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, now);
    }

    const multiplier = input.tierMultiplier ?? 1.0;
    // Earn 5% of amount paid in points multiplied by tier multiplier
    const pointsEarned = Math.max(1, Math.floor(input.amountPaid * 0.05 * multiplier));

    state.addPoints(pointsEarned, now);
    await this.ctx.states.save(state);

    await this.ctx.outbox.append([
      new LoyaltyPointsEarned({
        clientId: input.clientId,
        points: pointsEarned,
        newBalance: state.pointsBalance,
        appointmentId: input.appointmentId,
        occurredAt: now,
      }),
    ]);

    return {
      clientId: input.clientId,
      pointsEarned,
      newBalance: state.pointsBalance,
    };
  }
}
