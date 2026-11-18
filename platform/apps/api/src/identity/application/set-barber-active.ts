// DeactivateBarber/ActivateBarber — вимкнення/вмикання барбера (MNG-ADM-05).
// Деактивований барбер зникає з запису: не отримує нових візитів, його графік
// не будує слотів (T-023 Done). Ідемпотентно — повторна дія без події.

import { BarberActivated, BarberDeactivated } from '../domain/events';
import type { Clock, Outbox, UnitOfWork, UserRepository } from '../domain/ports';
import { BarberNotFoundError } from './barber-errors';

export interface SetBarberActiveDeps {
  users: UserRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class DeactivateBarberHandler {
  constructor(private readonly deps: SetBarberActiveDeps) {}

  async handle(id: string): Promise<{ id: string }> {
    const { users, outbox, clock, uow } = this.deps;
    return uow.run(async () => {
      const user = await findBarberOrThrow(users, id);
      if (!user.setActive(false)) return { id };
      await users.save(user);
      await outbox.append([new BarberDeactivated(user.id, clock.now())]);
      return { id: user.id };
    });
  }
}

export class ActivateBarberHandler {
  constructor(private readonly deps: SetBarberActiveDeps) {}

  async handle(id: string): Promise<{ id: string }> {
    const { users, outbox, clock, uow } = this.deps;
    return uow.run(async () => {
      const user = await findBarberOrThrow(users, id);
      if (!user.setActive(true)) return { id };
      await users.save(user);
      await outbox.append([new BarberActivated(user.id, clock.now())]);
      return { id: user.id };
    });
  }
}

async function findBarberOrThrow(users: UserRepository, id: string) {
  const user = await users.findById(id);
  if (!user || user.role !== 'barber') throw new BarberNotFoundError();
  return user;
}
