import { ListBarbersHandler } from './list-barbers';
import { FakeUserRepository } from './ports.fakes';
import { BarberNotFoundError } from './barber-errors';
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import { USER_1, USER_2, USER_3 } from './test-ids';

const T0 = new Date('2026-09-21T10:00:00.000Z');

function setup() {
  const users = new FakeUserRepository();
  const handler = new ListBarbersHandler(users);
  return { handler, users };
}

describe('ListBarbersHandler', () => {
  it('list() повертає лише барберів', async () => {
    const { handler, users } = setup();
    await users.save(
      User.create({
        id: USER_1,
        phone: PhoneNumber.of('+380501234567'),
        role: 'barber',
        createdAt: T0,
      })
    );
    await users.save(
      User.create({
        id: USER_2,
        phone: PhoneNumber.of('+380501234568'),
        role: 'client',
        createdAt: T0,
      })
    );
    await users.save(
      User.create({
        id: USER_3,
        phone: PhoneNumber.of('+380501234569'),
        role: 'barber',
        createdAt: T0,
      })
    );

    const all = await handler.list();
    expect(all.map((u) => u.id)).toEqual([USER_1, USER_3]);
  });

  it('findById() повертає барбера за id', async () => {
    const { handler, users } = setup();
    await users.save(
      User.create({
        id: USER_1,
        phone: PhoneNumber.of('+380501234567'),
        role: 'barber',
        createdAt: T0,
      })
    );

    const found = await handler.findById(USER_1);
    expect(found.id).toBe(USER_1);
  });

  it('не-барбер або невідомий id → BarberNotFoundError', async () => {
    const { handler, users } = setup();
    await users.save(
      User.create({
        id: USER_2,
        phone: PhoneNumber.of('+380501234568'),
        role: 'admin',
        createdAt: T0,
      })
    );
    await expect(handler.findById(USER_2)).rejects.toBeInstanceOf(BarberNotFoundError);
    await expect(handler.findById('nope')).rejects.toBeInstanceOf(BarberNotFoundError);
  });
});
