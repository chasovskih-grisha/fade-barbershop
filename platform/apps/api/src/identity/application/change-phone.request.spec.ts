// Функціональні спеки ChangePhoneRequest (T-4620a): код на новий номер
// надсилаємо з purpose phone_change (шаблон не як для логіна). Verify — окремо.
import { expectRejected } from '@fade/test-utils';
import { InvalidPhoneError } from './identity-errors';
import { NEW_PHONE, setupChangePhone } from './change-phone.fakes';

describe('ChangePhoneRequest (T-4620a): код на новий номер', () => {
  it('шле код з purpose phone_change і пише OtpRequested з тим самим purpose', async () => {
    const t = setupChangePhone();

    const result = await t.request.handle({ phone: NEW_PHONE });

    expect(result).toEqual({ retryAfterSec: 60 });
    expect(t.sender.sent[0]).toMatchObject({ phone: NEW_PHONE, purpose: 'phone_change' });
    expect(t.outbox.events[0]).toMatchObject({
      type: 'identity.otp.requested',
      payload: { phone: NEW_PHONE, purpose: 'phone_change' },
    });
  });

  it('невірний номер → InvalidPhoneError, код не надіслано', async () => {
    const t = setupChangePhone();

    await expectRejected(
      t.request.handle({ phone: 'не-номер' }),
      InvalidPhoneError,
      'не E.164 +380 — запит не приймаємо'
    );
    expect(t.sender.sent).toHaveLength(0);
  });
});
