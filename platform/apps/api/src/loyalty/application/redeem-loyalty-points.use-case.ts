import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import { LoyaltyPointsSpent } from '../domain/loyalty-events';

export interface RedeemLoyaltyPointsInput {
  clientId: string;
  pointsToRedeem: number;
  appointmentId?: string;
  occurredAt?: Date;
}

export interface RedeemLoyaltyPointsResult {
  clientId: string;
  pointsRedeemed: number;
  newBalance: number;
  success: boolean;
}

export class RedeemLoyaltyPointsHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: RedeemLoyaltyPointsInput): Promise<RedeemLoyaltyPointsResult> {
    const now = input.occurredAt ?? this.ctx.clock.now();
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, now);
    }

    const success = state.spendPoints(input.pointsToRedeem, now);
    if (!success) {
      return {
        clientId: input.clientId,
        pointsRedeemed: 0,
        newBalance: state.pointsBalance,
        success: false,
      };
    }

    await this.ctx.states.save(state);

    await this.ctx.outbox.append([
      new LoyaltyPointsSpent({
        clientId: input.clientId,
        points: input.pointsToRedeem,
        newBalance: state.pointsBalance,
        appointmentId: input.appointmentId,
        occurredAt: now,
      }),
    ]);

    return {
      clientId: input.clientId,
      pointsRedeemed: input.pointsToRedeem,
      newBalance: state.pointsBalance,
      success: true,
    };
  }
}
