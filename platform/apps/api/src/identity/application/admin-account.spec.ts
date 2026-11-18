// Спеки T-4411: зміна власного пароля. Ключовий ризик зі спеки —
// сесії після скидання/блокування інвалідовані (окремі спеки).
import { ChangeOwnPasswordHandler } from './admin-account';
import {
  AdminAccessForbiddenError,
  AdminInvalidCredentialsError,
  UserNotFoundError,
} from './identity-errors';
import { adminUser, expectError, harness, NOW, type Harness } from './admin-account.fakes';
import { hashPassword } from '../domain/password';
import { User } from '../domain/user';
import { PhoneNumber } from '../domain/phone-number';

import { testId } from './test-ids';
import { uuidv7 } from '@fade/domain-shared';

const A1 = uuidv7();
const NOHASH = uuidv7();
const REAL = uuidv7();
const C1 = uuidv7();
const A9 = uuidv7();
const GHOST = uuidv7();

const NEW_PASSWORD = 'NewPass123';
const ANON_ID = testId();

/** Зміна пароля актором має завершитися помилкою ctor (спільний патерн спеки). */
async function expectChangeFails(
  h: Harness,
  attempt: { actorId: string; currentPassword: string; newPassword?: string },
  ctor: new (...a: never[]) => Error
): Promise<void> {
  await expectError(
    new ChangeOwnPasswordHandler(h.deps).handle({ newPassword: NEW_PASSWORD, ...attempt }),
    ctor
  );
}

describe('ChangeOwnPassword', () => {
  it('успіх: хеш змінено, подія self_change, сесії живі', async () => {
    const h = harness();
    h.users.set(A1, adminUser(A1));
    const result = await new ChangeOwnPasswordHandler(h.deps).handle({
      actorId: A1,
      currentPassword: 'whatever',
      newPassword: NEW_PASSWORD,
    });
    expect(result.changedAt).toBe(NOW.toISOString());
    const saved = h.saved[0];
    if (!saved) throw new Error('user not saved');
    expect(saved.passwordHash).not.toBe('scrypt:x:y');
    expect(h.events.map((e) => e.type)).toEqual(['identity.password.changed']);
    expect(h.events[0]?.payload).toEqual({ userId: A1, actorId: A1, reason: 'self_change' });
    expect(h.revoked).toEqual([]);
  });

  it('гілки: null-хеш, реальний mismatch, не-адмін, короткий пароль, зниклий актор', async () => {
    const h = harness();
    h.users.set(NOHASH, adminUser(NOHASH, 'admin', null));
    await expectChangeFails(
      h,
      { actorId: NOHASH, currentPassword: 'x' },
      AdminInvalidCredentialsError
    );
    h.users.set(REAL, adminUser(REAL, 'admin', hashPassword('RightPass123')));
    await expectChangeFails(
      h,
      { actorId: REAL, currentPassword: 'WrongPass999' },
      AdminInvalidCredentialsError
    );
    h.users.set(C1, adminUser(C1, 'client'));
    await expectChangeFails(h, { actorId: C1, currentPassword: 'x' }, AdminAccessForbiddenError);
    h.users.set(A9, adminUser(A9));
    await expectChangeFails(
      h,
      { actorId: A9, currentPassword: 'w', newPassword: 'short' },
      AdminInvalidCredentialsError
    );
    await expectChangeFails(h, { actorId: GHOST, currentPassword: 'x' }, UserNotFoundError);
  });

  it('username відсутній → аудит пише id (?? fallback)', async () => {
    const h = harness();
    h.users.set(
      ANON_ID,
      User.create({
        id: ANON_ID,
        phone: PhoneNumber.of('+380501111111'),
        role: 'admin',
        name: null,
        active: true,
        selfSchedule: false,
        username: null,
        passwordHash: null,
        createdAt: NOW,
      })
    );
    await expectChangeFails(
      h,
      { actorId: ANON_ID, currentPassword: 'x' },
      AdminInvalidCredentialsError
    );
    expect(h.auditRows[0]).toMatchObject({ userId: ANON_ID, username: ANON_ID, ok: false });
  });
});
