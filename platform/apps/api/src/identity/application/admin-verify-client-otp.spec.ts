// AdminVerifyClientOtp (T-4409): успіх ставить phoneVerifiedAt, пише подію з
// актором і НЕ створює клієнтську сесію; ідемпотентність, невірний код, lock.
// Верифікація невідомого номера (onboarding, T-046) —
// admin-verify-client-otp-onboarding.spec.ts.
import { OtpInvalidError, OtpExpiredError, OtpLockedError } from './identity-errors';
import { NOW } from './admin-client-otp.fakes';
import { build, clientUser, verifyWithSent } from './admin-client-otp.fakes.env';
import { USER_1 } from './test-ids';
import { uuidv7 } from '@fade/domain-shared';

const ADMIN_ID = uuidv7();
const ACTOR = uuidv7();

describe('AdminVerifyClientOtp (T-4409)', () => {
  it('успіх → phoneVerifiedAt на User, подія PhoneVerified з актором, БЕЗ сесії', async () => {
    const t = build('+380501110004');
    t.users.save(clientUser(t.phone));
    await t.request.handle({ phone: t.phone });

    const res = await verifyWithSent(t, ADMIN_ID);

    expect(res.phoneVerifiedAt).toBe(NOW.toISOString());
    // T-046: verify віддає User.id (не ClientProfile.id), бо саме його читають
    // «Мої візити» (list-client-appointments) і origin.clientId.
    expect(res.clientId).toBe(USER_1);
    expect(t.users.store.get(USER_1)?.phoneVerifiedAt).toEqual(NOW);
    const verified = t.outbox.events.find((e) => e.type === 'identity.phone.verified');
    expect(verified?.payload).toMatchObject({ userId: USER_1, phone: t.phone, actorId: ADMIN_ID });
    // Верифікація адміном НЕ створює клієнтську сесію — ні структурно (нема
    // SessionRepository у deps), ні за подіями:
    expect(t.outbox.events.some((e) => e.type === 'identity.session.started')).toBe(false);
  });

  it('ідемпотентно: повторна верифікація (used) не зсуває дату і не додає подію', async () => {
    const t = build('+380501110005');
    t.users.save(clientUser(t.phone));
    await t.request.handle({ phone: t.phone });
    await verifyWithSent(t, ADMIN_ID);

    await expect(verifyWithSent(t, ADMIN_ID)).rejects.toBeInstanceOf(OtpExpiredError);
    expect(t.outbox.events.filter((e) => e.type === 'identity.phone.verified')).toHaveLength(1);
  });

  it('невірний код → OtpInvalidError (навіть якщо клієнта ще не існує)', async () => {
    const t = build('+380501110006');
    await t.request.handle({ phone: t.phone }); // challenge є, user-а немає

    await expect(
      t.verify.handle({ phone: t.phone, code: '000000', actorId: ACTOR })
    ).rejects.toBeInstanceOf(OtpInvalidError);
  });

  it('5 невдалих спроб → lock → OtpLockedError (гілка toVerifyError locked)', async () => {
    const t = build('+380501110007');
    t.users.save(clientUser(t.phone));
    await t.request.handle({ phone: t.phone });
    // Навмисно ХИБНИЙ код (не sent): помилка фізично не протікає повз тест.
    const handleWrong = () => t.verify.handle({ phone: t.phone, code: '111111', actorId: ACTOR });
    // 4 спроби вичерпують ліміт, 5-та — lock (OTP_MAX_ATTEMPTS = 5).
    for (let i = 0; i < 4; i += 1)
      await expect(handleWrong()).rejects.toBeInstanceOf(OtpInvalidError);

    const last = await handleWrong().catch((e: Error) => e);
    expect(last).toBeInstanceOf(OtpLockedError);
  });
});
