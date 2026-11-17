import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import { CashbackSpent } from '../domain/loyalty-events';

export interface RedeemCashbackInput {
  clientId: string;
  amountToRedeem: number;
  appointmentId?: string;
  occurredAt?: Date;
}

export interface RedeemCashbackResult {
  clientId: string;
  amountRedeemed: number;
  newBalance: number;
  success: boolean;
}

export class RedeemCashbackHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: RedeemCashbackInput): Promise<RedeemCashbackResult> {
    const now = input.occurredAt ?? this.ctx.clock.now();
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, now);
    }

    const success = state.spendCashback(input.amountToRedeem, now);
    if (!success) {
      return {
        clientId: input.clientId,
        amountRedeemed: 0,
        newBalance: state.cashbackBalance,
        success: false,
      };
    }

    await this.ctx.states.save(state);

    await this.ctx.outbox.append([
      new CashbackSpent({
        clientId: input.clientId,
        amount: input.amountToRedeem,
        newBalance: state.cashbackBalance,
        appointmentId: input.appointmentId,
        occurredAt: now,
      }),
    ]);

    return {
      clientId: input.clientId,
      amountRedeemed: input.amountToRedeem,
      newBalance: state.cashbackBalance,
      success: true,
    };
  }
}
