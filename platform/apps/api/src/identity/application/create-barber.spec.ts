import { CreateBarberHandler } from './create-barber';
import { FakeClock, FakeOutbox, FakeUserRepository, UuidIds, passthroughUow } from './ports.fakes';
import { BarberPhoneTakenError, InvalidBarberInputError } from './barber-errors';
import { InvalidPhoneError } from './identity-errors';
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';
import { USER_1 } from './test-ids';

const T0 = new Date('2026-09-21T10:00:00.000Z');

describe('CreateBarberHandler', () => {
  function setup() {
    const clock = new FakeClock(T0.toISOString());
    const users = new FakeUserRepository();
    const outbox = new FakeOutbox();
    const handler = new CreateBarberHandler({
      users,
      outbox,
      clock,
      ids: new UuidIds(),
      uow: passthroughUow,
    });
    return { handler, users, outbox };
  }

  it('створює барбера з роллю barber, trim-ім`ям і подією registered', async () => {
    const { handler, users, outbox } = setup();
    const result = await handler.handle({ name: '  Іван  ', phone: '+380501234567' });
    // T-4300e: id генерує UuidIds (uuidv7) — перевіряємо формат, не порядок вставки.
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );

    const barber = await users.findById(result.id);
    expect(barber).not.toBeNull();
    if (!barber) throw new Error('barber not found');
    expect(barber.role).toBe('barber');
    expect(barber.name).toBe('Іван');
    expect(barber.active).toBe(true);
    expect(outbox.events.map((e) => e.type)).toEqual(['identity.barber.registered']);
  });

  it('відхиляє порожнє ім`я', async () => {
    const { handler } = setup();
    await expect(handler.handle({ name: '   ', phone: '+380501234567' })).rejects.toBeInstanceOf(
      InvalidBarberInputError
    );
  });

  it('відхиляє невірний телефон', async () => {
    const { handler } = setup();
    await expect(handler.handle({ name: 'Іван', phone: '123' })).rejects.toBeInstanceOf(
      InvalidPhoneError
    );
  });

  it('відхиляє зайнятий телефон', async () => {
    const { handler, users } = setup();
    await users.save(
      User.create({
        id: USER_1,
        phone: PhoneNumber.of('+380501234567'),
        role: 'client',
        createdAt: T0,
      })
    );
    await expect(handler.handle({ name: 'Іван', phone: '+380501234567' })).rejects.toBeInstanceOf(
      BarberPhoneTakenError
    );
  });
});
