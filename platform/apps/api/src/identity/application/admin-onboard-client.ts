// Збірка «клієнт на місці» (T-046): identity (User) + crm (ClientProfile) в
// одній транзакції. Контексти розділені (ADR 0002/0017) і не імпортують одне
// одного, тож identity не знає про crm: identity-частина — AdminRegisterClient
// (User + ClientCreated), crm-частина приходить портом ClientProfilesPort
// (контекстно-агностичний, infra identity реєструє crm-адаптер). Немає порту —
// немає профілю (напр., ізольовані тести identity без crm-провайдерів).
// Викликач — verify (клієнта немає → створюємо) — див. identity-otp.providers.ts.
import type { UnitOfWork } from '../domain/ports';
import type { AdminRegisterClientHandler } from './admin-register-client';

/** Порт на crm: профіль гостя. Реалізує crm-адаптер (identity не пише картки).
 *  Контекстно-агностичний: identity/application не імпортує crm-домен. */
export interface ClientProfilesPort {
  createForUser(input: { userId: string; phone: string; name: string | null }): Promise<void>;
}

export interface AdminOnboardClientDeps {
  uow: UnitOfWork;
  /** Identity-частина: знайти клієнта або створити User з верифікованим номером. */
  registration: AdminRegisterClientHandler;
  /** Опційний: без crm-провайдера профіль не створюється (identity-only збірка). */
  clientProfiles?: ClientProfilesPort;
}

export interface AdminOnboardClientInput {
  phone: string;
  /** Імʼя з розмови (адмін чує клієнта); null — клієнт не назвався. */
  name?: string | null;
  actorId: string;
}

export interface AdminOnboardClientOutput {
  /** User.id — саме воно йде в origin.clientId візиту (T-046). */
  clientId: string;
  /** true — User створено зараз; false — вже існував (ідемпотентний виклик). */
  created: boolean;
}

/**
 * Створює клієнта «на місці»: User (identity) + ClientProfile (crm) в одній
 * транзакції (uow.run реентерабельний — вкладений виклик усередині verify не
 * відкриває другої транзакції). Клієнт уже існує → повертає наявного
 * (created: false), щоб UI підставив id у форму візиту.
 */
export class AdminOnboardClientHandler {
  constructor(private readonly deps: AdminOnboardClientDeps) {}

  async handle(input: AdminOnboardClientInput): Promise<AdminOnboardClientOutput> {
    const { uow, registration, clientProfiles } = this.deps;
    return uow.run(async () => {
      const registered = await registration.handle(input);
      if (registered.created && clientProfiles) {
        await clientProfiles.createForUser({
          userId: registered.userId,
          phone: input.phone,
          name: input.name ?? null,
        });
      }
      return { clientId: registered.userId, created: registered.created };
    });
  }
}
