// Знижки і лояльність (crm): VIP-знижка і лічильник візитів — керовані значення
// з подією «хто змінив» (снепшот до/після). Спільний контекст — CrmCommandContext.
import { ClientProfile } from '../domain/client-profile';
import { LoyaltyVisitsChanged, VipDiscountChanged } from '../domain/events';
import { ClientProfileNotFoundError } from './crm-errors';
import type { CrmCommandContext } from './crm-ports';
import { toClientId } from '../domain/client-profile.types';

export interface SetVipDiscountInput {
  clientId: string;
  percent: number | null;
  changedBy: string;
}

export interface SetVipDiscountOutput {
  client: ClientProfile;
}

export class SetVipDiscountHandler {
  constructor(private readonly ctx: CrmCommandContext) {}

  async handle(input: SetVipDiscountInput): Promise<SetVipDiscountOutput> {
    return this.ctx.uow.run(async () => {
      const profile = await this.ctx.profiles.findById(toClientId(input.clientId));
      if (!profile) throw new ClientProfileNotFoundError(input.clientId);

      const oldPercent = profile.vipDiscountPercent;
      profile.setVipDiscount(input.percent, this.ctx.clock);
      await this.ctx.outbox.append([
        new VipDiscountChanged({
          clientId: profile.id,
          oldPercent,
          newPercent: input.percent,
          changedBy: input.changedBy,
          occurredAt: this.ctx.clock.now(),
        }),
      ]);
      await this.ctx.profiles.save(profile);
      return { client: profile };
    });
  }
}

export interface SetLoyaltyVisitsInput {
  clientId: string;
  count: number;
  changedBy: string;
}

export interface SetLoyaltyVisitsOutput {
  client: ClientProfile;
}

export class SetLoyaltyVisitsHandler {
  constructor(private readonly ctx: CrmCommandContext) {}

  async handle(input: SetLoyaltyVisitsInput): Promise<SetLoyaltyVisitsOutput> {
    return this.ctx.uow.run(async () => {
      const profile = await this.ctx.profiles.findById(toClientId(input.clientId));
      if (!profile) throw new ClientProfileNotFoundError(input.clientId);

      const oldCount = profile.loyaltyVisitsCount;
      profile.setLoyaltyVisits(input.count, this.ctx.clock);
      await this.ctx.outbox.append([
        new LoyaltyVisitsChanged({
          clientId: profile.id,
          oldCount,
          newCount: input.count,
          changedBy: input.changedBy,
          occurredAt: this.ctx.clock.now(),
        }),
      ]);
      await this.ctx.profiles.save(profile);
      return { client: profile };
    });
  }
}
