// CreateBarber — команда «Додати барбера» (MNG-ADM-05). Барбер = User з роллю
// `barber` (той самий User, ADR 0005): телефон унікальний, пароль не потрібен —
// вхід через OTP. Якщо клієнт із таким телефоном уже існує — телефон зайнятий.

import { User } from '../domain/user';
import { BarberRegistered } from '../domain/events';
import { PhoneNumber } from '../domain/phone-number';
import { InvalidPhoneError } from './identity-errors';
import type { Clock, IdGenerator, Outbox, UnitOfWork, UserRepository } from '../domain/ports';
import { BarberPhoneTakenError, InvalidBarberInputError } from './barber-errors';

export interface CreateBarberInput {
  name: string;
  phone: string;
}

export interface CreateBarberDeps {
  users: UserRepository;
  outbox: Outbox;
  clock: Clock;
  ids: IdGenerator;
  uow: UnitOfWork;
}

export class CreateBarberHandler {
  constructor(private readonly deps: CreateBarberDeps) {}

  async handle(input: CreateBarberInput): Promise<{ id: string }> {
    const { users, outbox, clock, ids, uow } = this.deps;
    const name = input.name.trim();
    if (!name) throw new InvalidBarberInputError('Barber name is required');
    const phone = this.phoneOf(input.phone);
    return uow.run(async () => {
      const existing = await users.findByPhone(phone.value);
      if (existing) throw new BarberPhoneTakenError();

      const now = clock.now();
      const user = User.create({
        id: ids.id(),
        phone,
        role: 'barber',
        name,
        createdAt: now,
      });
      await users.save(user);
      await outbox.append([
        new BarberRegistered({ id: user.id, phone: user.phone.value, name }, now),
      ]);
      return { id: user.id };
    });
  }

  private phoneOf(phone: string): PhoneNumber {
    try {
      return PhoneNumber.of(phone);
    } catch {
      throw new InvalidPhoneError();
    }
  }
}
