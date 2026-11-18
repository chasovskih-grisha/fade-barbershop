// Успішний шлях VerifyOtp (T-014): неявна реєстрація, сесія, події,
// одноразовість коду, канал mobile. Невдалі сценарії — verify-otp.errors.spec.ts.
import { CORRECT_CODE, OTP_PHONE, T0, setupVerifyOtp, verifyCode } from './verify-otp.fakes';
import { OtpChallenge } from '../domain/otp-challenge';
import { hashOtpCode } from '../domain/otp-code';
import { OtpExpiredError } from './identity-errors';
import { testId } from './test-ids';

describe('VerifyOtpHandler: успіх', () => {
  it('реєструє клієнта, випускає сесію web, пише події і використовує код', async () => {
    const { handler, users, sessions, outbox, challenges } = setupVerifyOtp();
    const result = await handler.handle({ phone: OTP_PHONE, code: CORRECT_CODE, channel: 'web' });

    expect(result.token).toHaveLength(64);
    expect(result.phone).toBe(OTP_PHONE);
    expect(users.all).toHaveLength(1);
    expect(users.all[0]?.role).toBe('client');
    expect(sessions.all).toHaveLength(1);
    expect(sessions.all[0]?.channel).toBe('web');
    expect(sessions.all[0]?.tokenHash).not.toBe(result.token);

    const events = outbox.events.map((e) => e.type);
    expect(events).toEqual(['identity.user.registered', 'identity.session.started']);

    expect((await challenges.findLastByPhone(OTP_PHONE))?.usedAt).not.toBeNull();
  });

  it('повторний вхід того ж номера не створює нового клієнта', async () => {
    const { handler, outbox, challenges } = setupVerifyOtp();
    await verifyCode(handler, CORRECT_CODE);
    challenges.save(
      OtpChallenge.create({
        id: testId(),
        phone: OTP_PHONE,
        codeHash: hashOtpCode(CORRECT_CODE),
        now: new Date(Date.parse(T0) + 61_000),
      })
    );
    await handler.handle({ phone: OTP_PHONE, code: CORRECT_CODE, channel: 'mobile' });

    const events = outbox.events.map((e) => e.type);
    expect(events).toEqual([
      'identity.user.registered',
      'identity.session.started',
      'identity.session.started',
    ]);
  });

  it('повторне використання того самого коду — помилка (код одноразовий)', async () => {
    const { handler } = setupVerifyOtp();
    await verifyCode(handler, CORRECT_CODE);

    await expect(verifyCode(handler, CORRECT_CODE)).rejects.toBeInstanceOf(OtpExpiredError);
  });

  it('канал mobile створює mobile-сесію', async () => {
    const { handler, sessions } = setupVerifyOtp();
    await handler.handle({ phone: OTP_PHONE, code: CORRECT_CODE, channel: 'mobile' });

    expect(sessions.all[0]?.channel).toBe('mobile');
  });
});
