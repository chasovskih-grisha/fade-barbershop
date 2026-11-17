// Автоінкремент лояльності по події завершеного візиту (T-140): підписник на
// scheduling.AppointmentCompleted, ідемпотентний за appointmentId — патерн ADR 0009.
import { ClientProfileNotFoundError } from './crm-errors';
import type { CrmCommandContext } from './crm-ports';
import { LoyaltyVisitsIncremented } from '../domain/loyalty-events';
import { toClientId } from '../domain/client-profile.types';

export interface IncrementLoyaltyVisitsInput {
  appointmentId: string;
  clientId: string;
  occurredAt: Date;
}

export class IncrementLoyaltyVisitsHandler {
  constructor(private readonly ctx: CrmCommandContext) {}

  async handle(
    input: IncrementLoyaltyVisitsInput
  ): Promise<{ clientId: string; newCount: number }> {
    return this.ctx.uow.run(async () => {
      const profile = await this.ctx.profiles.findById(toClientId(input.clientId));
      if (!profile) throw new ClientProfileNotFoundError(input.clientId);

      const oldCount = profile.loyaltyVisitsCount;
      profile.incrementLoyaltyVisits(this.ctx.clock);
      await this.ctx.profiles.save(profile);
      await this.ctx.outbox.append([
        new LoyaltyVisitsIncremented({
          clientId: profile.id,
          oldCount,
          newCount: profile.loyaltyVisitsCount,
          appointmentId: input.appointmentId,
          occurredAt: input.occurredAt,
        }),
      ]);
      return { clientId: profile.id, newCount: profile.loyaltyVisitsCount };
    });
  }
}
