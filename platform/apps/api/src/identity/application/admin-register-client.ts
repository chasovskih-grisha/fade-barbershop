// Створення клієнта «на місці» адміном (T-046): телефонний запис для номера,
// якого ще немає в системі. У identity — знаходимо або створюємо User
// (роль client, phoneVerifiedAt = зараз: номер адмін щойно підтвердив кодом
// з розмови). Картку гостя (ClientProfile) створює crm — окремий контекст.
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { ClientCreated } from '../domain/events';
import { InvalidPhoneError } from './identity-errors';
import type { Clock, IdGenerator, Outbox, UnitOfWork, UserRepository } from '../domain/ports';

export interface AdminRegisterClientDeps {
  users: UserRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

export interface AdminRegisterClientInput {
  phone: string;
  /** Імʼя з розмови; null/undefined — клієнт не назвався. */
  name?: string | null;
  actorId: string;
}

export interface AdminRegisterClientOutput {
  /** User.id (існуючий або щойно створений) — для origin.clientId візиту. */
  userId: string;
  /** true — User створено зараз; false — вже існував (ідемпотентний виклик). */
  created: boolean;
}

/** Знаходить клієнта за номером або створює з верифікованим номером (T-046). */
export class AdminRegisterClientHandler {
  constructor(private readonly deps: AdminRegisterClientDeps) {}

  async handle(input: AdminRegisterClientInput): Promise<AdminRegisterClientOutput> {
    const { users, outbox, clock, ids, uow } = this.deps;
    return uow.run(async () => {
      let phone: PhoneNumber;
      try {
        phone = PhoneNumber.of(input.phone);
      } catch {
        throw new InvalidPhoneError();
      }
      const now = clock.now();
      const existing = await users.findByPhone(phone.value);
      if (existing) return { userId: existing.id, created: false };

      const user = User.create({
        id: ids.id(),
        phone,
        role: 'client',
        createdAt: now,
        phoneVerifiedAt: now,
      });
      await users.save(user);
      await outbox.append([
        new ClientCreated({
          userId: user.id,
          phone: phone.value,
          actorId: input.actorId,
          occurredAt: now,
        }),
      ]);
      return { userId: user.id, created: true };
    });
  }
}
