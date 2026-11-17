import { ClientLoyaltyState } from '../domain/client-loyalty-state';
import type { LoyaltyCommandContext } from '../domain/ports';
import { CashbackEarned } from '../domain/loyalty-events';

export interface EarnCashbackInput {
  clientId: string;
  amountPaid: number;
  cashbackPercent?: number; // e.g. 3%, 5%, 7% based on tier
  appointmentId?: string;
  occurredAt?: Date;
}

export interface EarnCashbackResult {
  clientId: string;
  cashbackEarned: number;
  newBalance: number;
}

export class EarnCashbackHandler {
  constructor(private readonly ctx: LoyaltyCommandContext) {}

  async handle(input: EarnCashbackInput): Promise<EarnCashbackResult> {
    const now = input.occurredAt ?? this.ctx.clock.now();
    let state = await this.ctx.states.findByClientId(input.clientId);
    if (!state) {
      state = ClientLoyaltyState.createNew(input.clientId, now);
    }

    const percent = input.cashbackPercent ?? 3.0; // default 3% cashback
    const cashbackEarned = Math.round(input.amountPaid * (percent / 100) * 100) / 100;

    if (cashbackEarned > 0) {
      state.addCashback(cashbackEarned, now);
      await this.ctx.states.save(state);

      await this.ctx.outbox.append([
        new CashbackEarned({
          clientId: input.clientId,
          amount: cashbackEarned,
          newBalance: state.cashbackBalance,
          appointmentId: input.appointmentId,
          occurredAt: now,
        }),
      ]);
    }

    return {
      clientId: input.clientId,
      cashbackEarned,
      newBalance: state.cashbackBalance,
    };
  }
}
