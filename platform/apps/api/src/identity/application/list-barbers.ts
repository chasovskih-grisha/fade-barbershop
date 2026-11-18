// ListBarbers — список «Персонал» (admin-screens §2.1). list() — усі барбери,
// findById() — один за id; використовує UserRepository.listByRole.

import type { User } from '../domain/user';
import type { UserRepository } from '../domain/ports';
import { BarberNotFoundError } from './barber-errors';

export class ListBarbersHandler {
  constructor(private readonly users: UserRepository) {}

  list(): Promise<User[]> {
    return this.users.listByRole('barber');
  }

  async findById(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user || user.role !== 'barber') throw new BarberNotFoundError();
    return user;
  }
}
