import { User } from './user';
import { PhoneNumber } from './phone-number';
import { USER_1, USER_2 } from '../application/test-ids';

describe('User', () => {
  const now = new Date('2026-09-21T10:00:00.000Z');

  it('створюється з ідентифікаційними даними', () => {
    const user = User.create({
      id: USER_1,
      phone: PhoneNumber.of('+380501234567'),
      role: 'client',
      createdAt: now,
    });
    expect(user.id).toBe(USER_1);
    expect(user.phone.value).toBe('+380501234567');
    expect(user.role).toBe('client');
  });

  it('адмін несе username/passwordHash; client — ні', () => {
    const admin = User.create({
      id: USER_1,
      phone: PhoneNumber.of('+380501234567'),
      role: 'admin',
      username: 'owner',
      passwordHash: 'scrypt:ab:cd',
      createdAt: now,
    });
    expect(admin.isAdmin).toBe(true);
    expect(admin.username).toBe('owner');
    expect(admin.passwordHash).toBe('scrypt:ab:cd');

    const client = User.create({
      id: USER_2,
      phone: PhoneNumber.of('+380501234568'),
      role: 'client',
      createdAt: now,
    });
    expect(client.isAdmin).toBe(false);
    expect(client.username).toBeUndefined();
    expect(client.passwordHash).toBeUndefined();
  });
});

describe('User mutations', () => {
  const now = new Date('2026-09-21T10:00:00.000Z');
  const phone = PhoneNumber.of('+380501234567');

  it('rename оновлює імʼя та є ідемпотентним', () => {
    const user = User.create({ id: USER_1, phone, role: 'barber', name: 'Ivan', createdAt: now });
    expect(user.rename('  Petro ')).toBe(true);
    expect(user.name).toBe('Petro');
    expect(user.rename('Petro')).toBe(false);
    expect(user.rename(null)).toBe(true);
    expect(user.name).toBeNull();
  });

  it('setActive/setSelfSchedule ідемпотентні', () => {
    const user = User.create({ id: USER_1, phone, role: 'client', createdAt: now });
    expect(user.active).toBe(true);
    expect(user.setActive(false)).toBe(true);
    expect(user.active).toBe(false);
    expect(user.setActive(false)).toBe(false);
    expect(user.selfSchedule).toBe(false);
    expect(user.setSelfSchedule(true)).toBe(true);
    expect(user.selfSchedule).toBe(true);
    expect(user.setSelfSchedule(true)).toBe(false);
  });

  it('promoteToBarber підвищує клієнта і не змінює барбера', () => {
    const client = User.create({ id: USER_1, phone, role: 'client', createdAt: now });
    expect(client.promoteToBarber('Andriy')).toBe(true);
    expect(client.role).toBe('barber');
    expect(client.name).toBe('Andriy');
    expect(client.promoteToBarber('Andriy')).toBe(false);
    expect(client.role).toBe('barber');
  });

  it('reconstitute відтворює стан', () => {
    const user = User.reconstitute({
      id: USER_1,
      phone,
      role: 'barber',
      name: 'Ivan',
      email: null,
      phoneVerifiedAt: null,
      active: false,
      selfSchedule: true,
      username: 'ivan',
      passwordHash: 'h',
      createdAt: now,
    });
    expect(user.name).toBe('Ivan');
    expect(user.active).toBe(false);
    expect(user.selfSchedule).toBe(true);
    expect(user.username).toBe('ivan');
  });
});
