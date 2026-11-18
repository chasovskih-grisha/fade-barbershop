import { ActivateBarberHandler, DeactivateBarberHandler } from './set-barber-active';
import { FakeClock, FakeOutbox, FakeUserRepository, passthroughUow } from './ports.fakes';
import { BarberNotFoundError } from './barber-errors';
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import { USER_1 } from './test-ids';

const T0 = new Date('2026-09-21T10:00:00.000Z');

function barber(active = true): User {
  return User.create({
    id: USER_1,
    phone: PhoneNumber.of('+380501234567'),
    role: 'barber',
    name: 'Іван',
    active,
    createdAt: T0,
  });
}

function deps() {
  return {
    users: new FakeUserRepository(),
    outbox: new FakeOutbox(),
    clock: new FakeClock(T0.toISOString()),
    uow: passthroughUow,
  };
}

describe('DeactivateBarberHandler', () => {
  it('вимикає барбера і публікує подію', async () => {
    const d = deps();
    const handler = new DeactivateBarberHandler(d);
    await d.users.save(barber());

    await handler.handle(USER_1);

    const saved = await d.users.findById(USER_1);
    expect(saved?.active).toBe(false);
    expect(d.outbox.events.map((e) => e.type)).toEqual(['identity.barber.deactivated']);
  });

  it('повторна деактивація ідемпотентна — без події', async () => {
    const d = deps();
    const handler = new DeactivateBarberHandler(d);
    await d.users.save(barber(false));

    await handler.handle(USER_1);

    expect(d.outbox.events).toHaveLength(0);
  });

  it('барбера немає → BarberNotFoundError', async () => {
    const d = deps();
    const handler = new DeactivateBarberHandler(d);
    await expect(handler.handle('nope')).rejects.toBeInstanceOf(BarberNotFoundError);
  });
});

describe('ActivateBarberHandler', () => {
  it('вмикає барбера і публікує подію', async () => {
    const d = deps();
    const handler = new ActivateBarberHandler(d);
    await d.users.save(barber(false));

    await handler.handle(USER_1);

    const saved = await d.users.findById(USER_1);
    expect(saved?.active).toBe(true);
    expect(d.outbox.events.map((e) => e.type)).toEqual(['identity.barber.activated']);
  });

  it('повторна активація ідемпотентна — без події', async () => {
    const d = deps();
    const handler = new ActivateBarberHandler(d);
    await d.users.save(barber());

    await handler.handle(USER_1);

    expect(d.outbox.events).toHaveLength(0);
  });

  it('барбера немає → BarberNotFoundError', async () => {
    const d = deps();
    const handler = new ActivateBarberHandler(d);
    await expect(handler.handle('nope')).rejects.toBeInstanceOf(BarberNotFoundError);
  });
});
