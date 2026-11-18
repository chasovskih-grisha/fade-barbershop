import { RequestOtpHandler } from './request-otp';
import {
  FakeClock,
  FakeOtpChallengeRepository,
  FakeOtpSender,
  FakeOutbox,
  UuidIds,
  passthroughUow,
} from './ports.fakes';
import { InvalidPhoneError, OtpResendTooSoonError } from './identity-errors';
import { otpMatches } from '../domain/otp-code';

describe('RequestOtpHandler', () => {
  const T0 = '2026-09-21T10:00:00.000Z';

  function setup() {
    const clock = new FakeClock(T0);
    const challenges = new FakeOtpChallengeRepository();
    const sender = new FakeOtpSender();
    const outbox = new FakeOutbox();
    const ids = new UuidIds();
    const handler = new RequestOtpHandler({
      challenges,
      sender,
      outbox,
      clock,
      ids,
      uow: passthroughUow,
    });
    return { handler, clock, challenges, sender, outbox };
  }

  it('створює шалендж (хеш коду), надсилає SMS і кладе подію вимоги', async () => {
    const { handler, challenges, sender, outbox } = setup();
    const result = await handler.handle({ phone: '+380501234567' });
    expect(result.retryAfterSec).toBe(60);

    const challenge = await challenges.findLastByPhone('+380501234567');
    expect(challenge).not.toBeNull();
    expect(challenge?.codeHash).toMatch(/^[0-9a-f]{16}:[0-9a-f]{64}$/);

    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0]?.phone).toBe('+380501234567');
    expect(sender.sent[0]?.digits).toMatch(/^\d{6}$/);
    expect(otpMatches(challenge?.codeHash ?? '', sender.sent[0]?.digits ?? '')).toBe(true);

    expect(outbox.events.map((e) => e.type)).toEqual(['identity.otp.requested']);
  });

  it('двічі протягом 60 с — помилка повторного запиту', async () => {
    const { handler } = setup();
    await handler.handle({ phone: '+380501234567' });
    await expect(handler.handle({ phone: '+380501234567' })).rejects.toBeInstanceOf(
      OtpResendTooSoonError
    );
  });

  it('через 60+ с можна переслати код', async () => {
    const { handler, clock } = setup();
    await handler.handle({ phone: '+380501234567' });
    clock.advance(61_000);
    const result = await handler.handle({ phone: '+380501234567' });
    expect(result.retryAfterSec).toBe(60);
  });

  it('невалідний номер — InvalidPhoneError', async () => {
    const { handler } = setup();
    await expect(handler.handle({ phone: '+12025550123' })).rejects.toBeInstanceOf(
      InvalidPhoneError
    );
  });
});
