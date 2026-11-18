import { UpdateBarberHandler } from './update-barber';
import { FakeClock, FakeOutbox, FakeUserRepository, passthroughUow } from './ports.fakes';
import { BarberNotFoundError, InvalidBarberInputError } from './barber-errors';
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import { USER_1, USER_2 } from './test-ids';
import { testId } from './test-ids';

const T0 = new Date('2026-09-21T10:00:00.000Z');

function barber(): User {
  return User.create({
    id: USER_1,
    phone: PhoneNumber.of('+380501234567'),
    role: 'barber',
    name: 'Іван',
    selfSchedule: false,
    createdAt: T0,
  });
}

describe('UpdateBarberHandler', () => {
  function setup() {
    const clock = new FakeClock(T0.toISOString());
    const users = new FakeUserRepository();
    const outbox = new FakeOutbox();
    const handler = new UpdateBarberHandler({
      users,
      outbox,
      clock,
      uow: passthroughUow,
    });
    return { handler, users, outbox };
  }

  it('оновлює ім`я та selfSchedule, публікує BarberUpdated', async () => {
    const { handler, users, outbox } = setup();
    await users.save(barber());

    await handler.handle({ id: USER_1, name: 'Петро', selfSchedule: true });

    const saved = await users.findById(USER_1);
    expect(saved?.name).toBe('Петро');
    expect(saved?.selfSchedule).toBe(true);
    expect(outbox.events.map((e) => e.type)).toEqual(['identity.barber.updated']);
  });

  it('без змін не публікує подію', async () => {
    const { handler, users, outbox } = setup();
    await users.save(barber());
    await handler.handle({ id: USER_1 });
    expect(outbox.events).toHaveLength(0);
  });

  it('відхиляє порожнє ім`я', async () => {
    const { handler, users } = setup();
    await users.save(barber());
    await expect(handler.handle({ id: USER_1, name: '  ' })).rejects.toBeInstanceOf(
      InvalidBarberInputError
    );
  });

  it('барбера немає → BarberNotFoundError', async () => {
    const { handler } = setup();
    await expect(handler.handle({ id: testId() })).rejects.toBeInstanceOf(BarberNotFoundError);
  });

  it('не-барбер за id → BarberNotFoundError', async () => {
    const { handler, users } = setup();
    await users.save(
      User.create({
        id: USER_2,
        phone: PhoneNumber.of('+380501234568'),
        role: 'client',
        createdAt: T0,
      })
    );
    await expect(handler.handle({ id: USER_2 })).rejects.toBeInstanceOf(BarberNotFoundError);
  });
});
