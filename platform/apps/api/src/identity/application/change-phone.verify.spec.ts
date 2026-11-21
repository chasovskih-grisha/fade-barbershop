// Функціональні спеки ChangePhoneVerify (T-4620a): перенос номера на той самий
// User, ревок інших сесій, колізія номера, повторне використання коду.
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { expectRejected } from '@fade/test-utils';
import {
  OtpExpiredError,
  OtpPurposeMismatchError,
  PhoneTakenError,
  UserNotFoundError,
} from './identity-errors';
import {
  CODE,
  NEW_PHONE,
  OLD_PHONE,
  SESSION_1,
  SESSION_2,
  T0,
  USER_1,
  USER_2,
  seedPhoneChangeCode,
  setupChangePhone,
} from './change-phone.fakes';

const VERIFY = { userId: USER_1, currentSessionId: SESSION_1, phone: NEW_PHONE, code: CODE };

describe('ChangePhoneVerify (T-4620a): перенос номера на той самий User', () => {
  it('верифікований новий номер замінює старий на тому самому user id', async () => {
    const t = setupChangePhone();
    seedPhoneChangeCode(t.challenges);

    const result = await t.verify.handle(VERIFY);

    expect(result).toEqual({ ok: true, phone: NEW_PHONE });
    expect((await t.users.findById(USER_1))?.phone?.value).toBe(NEW_PHONE);
    expect(t.users.all).toHaveLength(1);
  });

  it('подія identity.user.phone.changed несе старий і новий номер', async () => {
    const t = setupChangePhone();
    seedPhoneChangeCode(t.challenges);

    await t.verify.handle(VERIFY);

    expect(t.outbox.events.at(-1)).toMatchObject({
      type: 'identity.user.phone.changed',
      payload: { userId: USER_1, oldPhone: OLD_PHONE, newPhone: NEW_PHONE },
    });
  });

  it('інші сесії ревоковано, поточна лишається активною', async () => {
    const t = setupChangePhone();
    seedPhoneChangeCode(t.challenges);

    await t.verify.handle(VERIFY);

    expect(t.sessions.all.find((s) => s.id === SESSION_1)?.active).toBe(true);
    expect(t.sessions.all.find((s) => s.id === SESSION_2)?.active).toBe(false);
  });

  it('код іншого призначення (login) не завершує зміну номера', async () => {
    const t = setupChangePhone();
    seedPhoneChangeCode(t.challenges, CODE, 'login');

    await expectRejected(
      t.verify.handle(VERIFY),
      OtpPurposeMismatchError,
      'purpose перевіряємо, а не лише цифри — логін-код не міняє номер'
    );
    expect((await t.users.findById(USER_1))?.phone?.value).toBe(OLD_PHONE);
  });

  it('номер уже належить іншому акаунту → PhoneTakenError, обидва без змін', async () => {
    const t = setupChangePhone();
    seedPhoneChangeCode(t.challenges);
    t.users.save(
      User.create({
        id: USER_2,
        phone: PhoneNumber.of(NEW_PHONE),
        role: 'client',
        createdAt: new Date(T0),
      })
    );

    await expectRejected(
      t.verify.handle(VERIFY),
      PhoneTakenError,
      'без авто-merge (T-4423): зайнятий номер не переносимо'
    );
    expect((await t.users.findById(USER_1))?.phone?.value).toBe(OLD_PHONE);
    expect((await t.users.findById(USER_2))?.phone?.value).toBe(NEW_PHONE);
    expect(t.outbox.events).toHaveLength(0);
  });

  it('повторна верифікація вже використаного коду не переносить номер ще раз', async () => {
    const t = setupChangePhone();
    seedPhoneChangeCode(t.challenges);
    await t.verify.handle(VERIFY);
    const eventsAfterFirst = t.outbox.events.length;

    await expectRejected(
      t.verify.handle(VERIFY),
      OtpExpiredError,
      'код одноразовий: used → помилка, другого переносу немає'
    );
    expect(t.outbox.events).toHaveLength(eventsAfterFirst);
  });

  it('немає User за сесією → UserNotFoundError', async () => {
    const t = setupChangePhone();
    seedPhoneChangeCode(t.challenges);

    await expectRejected(
      t.verify.handle({ ...VERIFY, userId: '00000000-0000-7000-8000-000000000000' }),
      UserNotFoundError,
      'сесія без користувача не має куди переносити номер'
    );
  });
});
