// UpdateBarber — оновлення імені та прапорця «керувати графіком сам» (MNG-ADM-05,
// фаза 22 — SCH-001). Часткове оновлення: поля, яких немає в input, не змінюються.

import { BarberUpdated } from '../domain/events';
import type { Clock, Outbox, UnitOfWork, UserRepository } from '../domain/ports';
import { BarberNotFoundError, InvalidBarberInputError } from './barber-errors';

export interface UpdateBarberInput {
  id: string;
  name?: string;
  selfSchedule?: boolean;
}

export interface UpdateBarberDeps {
  users: UserRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class UpdateBarberHandler {
  constructor(private readonly deps: UpdateBarberDeps) {}

  async handle(input: UpdateBarberInput): Promise<{ id: string }> {
    const { users, outbox, clock, uow } = this.deps;
    return uow.run(async () => {
      const user = await this.findBarber(input.id);
      const changed: { name?: string | null; selfSchedule?: boolean } = {};

      if (input.name !== undefined) {
        if (!input.name.trim()) throw new InvalidBarberInputError('Barber name is required');
        if (user.rename(input.name)) changed.name = user.name;
      }
      if (input.selfSchedule !== undefined && user.setSelfSchedule(input.selfSchedule)) {
        changed.selfSchedule = user.selfSchedule;
      }

      if (Object.keys(changed).length > 0) {
        await users.save(user);
        await outbox.append([new BarberUpdated(user.id, changed, clock.now())]);
      }
      return { id: user.id };
    });
  }

  private async findBarber(id: string) {
    const user = await this.deps.users.findById(id);
    if (!user || user.role !== 'barber') throw new BarberNotFoundError();
    return user;
  }
}
