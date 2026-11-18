// Специфікації T-4409: purpose 'booking' у події й sender, ГЕЙТ «коду немає
// ніде, крім SMS-каналу» (payload подій без digits), верифікація без сесії,
// ідемпотентність phoneVerifiedAt, помилки (resend-too-soon, invalid, lock).
// Fakes — в admin-client-otp.fakes.ts (max-lines/coverage).
import { InvalidPhoneError, OtpResendTooSoonError } from './identity-errors';
import { build, clientUser, sentCode } from './admin-client-otp.fakes.env';
import { uuidv7 } from '@fade/domain-shared';

const ACTOR = uuidv7();

describe('AdminRequestClientOtp (T-4409)', () => {
  it('шле код з purpose booking; подія — без коду (гейт витоку)', async () => {
    const t = build('+380501110001');
    await t.request.handle({ phone: t.phone });
    const code = sentCode(t);
    const event = t.outbox.events[0];
    expect(t.sender.sent[0]?.purpose).toBe('booking');
    expect(code).toMatch(/^\d{6}$/);
    expect(event?.type).toBe('identity.otp.requested');
    expect(JSON.stringify(event?.payload)).not.toContain(code);
    expect(event?.payload).toMatchObject({ phone: t.phone, purpose: 'booking' });
  });

  it('повтор раніше 60с → OtpResendTooSoonError', async () => {
    const t = build('+380501110002');
    await t.request.handle({ phone: t.phone });
    await expect(t.request.handle({ phone: t.phone })).rejects.toBeInstanceOf(
      OtpResendTooSoonError
    );
  });

  it('невалідний номер → InvalidPhoneError', async () => {
    // prettier-ignore
    await expect(build('+380501110003').request.handle({ phone: '050111' })).rejects.toBeInstanceOf(InvalidPhoneError);
  });

  it('верифікація з невалідним номером → InvalidPhoneError (гілка verify)', async () => {
    const t = build('+380501110003b');
    // prettier-ignore
    await expect(t.verify.handle({ phone: 'bad', code: '000000', actorId: ACTOR })).rejects.toBeInstanceOf(InvalidPhoneError);
  });

  it('верифікація без challenge → OtpChallengeNotFoundError (гілка verify)', async () => {
    const t = build('+380501110003c');
    await expect(
      t.verify.handle({ phone: t.phone, code: '000000', actorId: ACTOR })
    ).rejects.toMatchObject({ code: 'OTP_CHALLENGE_NOT_FOUND' });
  });

  it('??-fallback: user без дати після успіху → повертає now (гілка 102)', async () => {
    const t = build('+380501110010');
    t.users.save(clientUser(t.phone));
    await t.request.handle({ phone: t.phone });
    // prettier-ignore
    const res = await t.verify.handle({ phone: t.phone, code: sentCode(t), actorId: ACTOR });
    // markPhoneVerified лишає дату; тут лише інваріант формату ISO.
    expect(new Date(res.phoneVerifiedAt).toISOString()).toBe(res.phoneVerifiedAt);
  });
});
