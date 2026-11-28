// Команди профілю (crm): оновлення імені/телефону і вподобань. Один use case —
// одна причина зміни; спільний контекст — CrmCommandContext (bundle).
import { ClientProfile } from '../domain/client-profile';
import { PreferencesUpdated } from '../domain/events';
import { ClientProfileNotFoundError } from './crm-errors';
import type { CrmCommandContext } from './crm-ports';

export interface UpdateClientProfileInput {
  clientId: string;
  name?: string | null;
  phone?: string;
}

export interface UpdateClientProfileOutput {
  client: ClientProfile;
}

export class UpdateClientProfileHandler {
  constructor(private readonly ctx: CrmCommandContext) {}

  async handle(input: UpdateClientProfileInput): Promise<UpdateClientProfileOutput> {
    return this.ctx.uow.run(async () => {
      const profile = await this.ctx.profiles.findById(input.clientId as never);
      if (!profile) throw new ClientProfileNotFoundError(input.clientId);

      if (input.name !== undefined) profile.updateName(input.name ?? null, this.ctx.clock);
      if (input.phone !== undefined) profile.updatePhone(input.phone, this.ctx.clock);

      await this.ctx.profiles.save(profile);
      return { client: profile };
    });
  }
}

export interface UpdatePreferencesInput {
  clientId: string;
  preferences: string[];
}

export interface UpdatePreferencesOutput {
  client: ClientProfile;
}

export class UpdatePreferencesHandler {
  constructor(private readonly ctx: CrmCommandContext) {}

  async handle(input: UpdatePreferencesInput): Promise<UpdatePreferencesOutput> {
    return this.ctx.uow.run(async () => {
      const profile = await this.ctx.profiles.findById(input.clientId as never);
      if (!profile) throw new ClientProfileNotFoundError(input.clientId);

      profile.updatePreferences(input.preferences, this.ctx.clock, this.ctx.ids);
      await this.ctx.outbox.append([
        new PreferencesUpdated({
          clientId: profile.id,
          preferences: profile.preferences,
          occurredAt: this.ctx.clock.now(),
        }),
      ]);
      await this.ctx.profiles.save(profile);
      return { client: profile };
    });
  }
}

export interface UpdateUsualChairInput {
  clientId: string;
  locationId?: string | null;
  barberId?: string | null;
}

export interface UpdateUsualChairOutput {
  client: ClientProfile;
}

export interface UpdateBirthdayInput {
  clientId: string;
  birthday: { day: number; month: number } | null;
}

export interface UpdateBirthdayOutput {
  client: ClientProfile;
}

/**
 * Зберігає звичну локацію і барбера (T-4725). Нічого не надсилає і не чіпає
 * записи: це вподобання профілю, не перенос візиту. null очищає поле.
 */
export class UpdateUsualChairHandler {
  constructor(private readonly ctx: CrmCommandContext) {}

  async handle(input: UpdateUsualChairInput): Promise<UpdateUsualChairOutput> {
    return this.ctx.uow.run(async () => {
      const profile = await this.ctx.profiles.findById(input.clientId as never);
      if (!profile) throw new ClientProfileNotFoundError(input.clientId);

      // Відсутнє поле лишається як було; null — явне очищення саме цього поля.
      const current = profile.usualChair;
      profile.setUsualChair(
        {
          locationId: input.locationId !== undefined ? input.locationId : current.locationId,
          barberId: input.barberId !== undefined ? input.barberId : current.barberId,
        },
        this.ctx.clock
      );
      await this.ctx.profiles.save(profile);
      return { client: profile };
    });
  }
}

/** Зберігає або очищає день і місяць народження (T-4730). Нічого не надсилає. */
export class UpdateBirthdayHandler {
  constructor(private readonly ctx: CrmCommandContext) {}

  async handle(input: UpdateBirthdayInput): Promise<UpdateBirthdayOutput> {
    return this.ctx.uow.run(async () => {
      const profile = await this.ctx.profiles.findById(input.clientId as never);
      if (!profile) throw new ClientProfileNotFoundError(input.clientId);

      profile.setBirthday(input.birthday, this.ctx.clock);
      await this.ctx.profiles.save(profile);
      return { client: profile };
    });
  }
}
