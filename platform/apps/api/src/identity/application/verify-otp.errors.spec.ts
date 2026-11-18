// VerifyOtp — невдалі сценарії (T-014, ADR 0005): невірний код, блокування
// перебору, прострочення, відсутній шалендж, невалідний номер. Успішний
// шлях і сесії — verify-otp.spec.ts; хелпери — verify-otp.fakes.ts.
// prettier-ignore
import { InvalidOtpInputError, OtpChallengeNotFoundError, OtpExpiredError, OtpInvalidError, OtpLockedError } from './identity-errors';
// prettier-ignore
import { CORRECT_CODE, OTP_PHONE, WRONG_CODE, failWrongCode, setupVerifyOtp, verifyCode } from './verify-otp.fakes';
import { expectRejected } from '@fade/test-utils';

const LOCK_AFTER_ATTEMPTS = 5;

describe('VerifyOtp: невірний код і лічильник спроб', () => {
  it('невірний код → OtpInvalidError; спроба зберігається в шаленджі', async () => {
    const { handler, challenges } = setupVerifyOtp();

    await expectRejected(
      verifyCode(handler, WRONG_CODE),
      OtpInvalidError,
      'код не збігається з хешем'
    );

    expect((await challenges.findLastByPhone(OTP_PHONE))?.attempts).toBe(1);
  });

  it.each([1, 2, 3])(
    'спроба %i — ще OtpInvalidError (поріг блокування не досягнутий)',
    async (attempt) => {
      const { handler } = setupVerifyOtp();
      await failWrongCode(handler, attempt - 1);

      await expectRejected(
        verifyCode(handler, WRONG_CODE),
        OtpInvalidError,
        `невдала спроба №${attempt} — ліміт ${LOCK_AFTER_ATTEMPTS} ще не вичерпано`
      );
    }
  );
});

describe('VerifyOtp: блокування перебору', () => {
  it(`${LOCK_AFTER_ATTEMPTS} невдалих спроб поспіль → OtpLockedError`, async () => {
    const { handler } = setupVerifyOtp();
    await failWrongCode(handler, LOCK_AFTER_ATTEMPTS - 1);

    await expectRejected(
      verifyCode(handler, WRONG_CODE),
      OtpLockedError,
      `${LOCK_AFTER_ATTEMPTS}-а невдала спроба вичерпує ліміт`
    );
  });

  it('під час блокування навіть правильний код відхиляється (захист від підбору)', async () => {
    const { handler } = setupVerifyOtp();
    await failWrongCode(handler, LOCK_AFTER_ATTEMPTS);

    await expectRejected(
      verifyCode(handler, CORRECT_CODE),
      OtpLockedError,
      'блокування діє на весь шалендж, а не лише на невірні коди'
    );
  });
});

describe('VerifyOtp: прострочення і відсутній шалендж', () => {
  it('код прострочений (+5хв) → OtpExpiredError навіть з правильним кодом', async () => {
    const { handler, clock } = setupVerifyOtp();
    clock.advance(5 * 60_000 + 1_000);

    await expectRejected(
      verifyCode(handler, CORRECT_CODE),
      OtpExpiredError,
      'прошло TTL шаленджу — пара телефон+код мертва'
    );
  });

  it('шаленджу на номер немає → OtpChallengeNotFoundError', async () => {
    const { handler } = setupVerifyOtp(false);

    await expectRejected(
      verifyCode(handler, CORRECT_CODE),
      OtpChallengeNotFoundError,
      'OTP не запитували — верифікувати нічого'
    );
  });

  it('не-український номер → InvalidOtpInputError (контракт +380)', async () => {
    const { handler } = setupVerifyOtp();

    await expectRejected(
      verifyCode(handler, CORRECT_CODE, '+12025550123'),
      InvalidOtpInputError,
      'номер поза зоною +380 відхиляється до пошуку шаленджу'
    );
  });
});
