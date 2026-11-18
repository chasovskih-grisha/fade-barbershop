// T-4805: заявка на стирання приймається лише з валідним OTP, повторна
// заявка не створює другий рядок і не світить, чи номер існує.
import { RequestErasure, phoneHash } from './request-erasure';
import {
  ErasureOtpInvalidError,
  ErasureSubjectNotFoundError,
} from './erasure.ports';
import { FakeErasureStore, FakeOtp, USER_ID } from './erasure.fakes';

const NOW = new Date('2026-11-17T10:00:00Z');

function build(store = new FakeErasureStore(), otp = new FakeOtp()) {
  return { service: new RequestErasure({ store, otp }), store };
}

describe('RequestErasure (T-4805)', () => {
  it('з валідним OTP створює pending-заявку', async () => {
    const { service, store } = build();
    const record = await service.execute({ phone: '+380501112233', code: '123456' }, NOW);

    expect(record.status).toBe('pending');
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]?.subject.userId).toBe(USER_ID);
  });

  it('без валідного OTP заявки немає', async () => {
    const { service, store } = build();
    await expect(
      service.execute({ phone: '+380501112233', code: '000000' }, NOW)
    ).rejects.toBeInstanceOf(ErasureOtpInvalidError);
    expect(store.rows).toHaveLength(0);
  });

  it('невідомий номер не створює заявку', async () => {
    const store = new FakeErasureStore();
    store.subject = null;
    const { service } = build(store);
    await expect(
      service.execute({ phone: '+380501112233', code: '123456' }, NOW)
    ).rejects.toBeInstanceOf(ErasureSubjectNotFoundError);
  });

  it('повторна заявка ідемпотентна', async () => {
    const { service, store } = build();
    const first = await service.execute({ phone: '+380501112233', code: '123456' }, NOW);
    const second = await service.execute({ phone: '+380501112233', code: '123456' }, NOW);
    expect(second.id).toBe(first.id);
    expect(store.rows).toHaveLength(1);
  });

  it('хеш номера не містить plaintext', () => {
    const hash = phoneHash('+380501112233');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('380501112233');
  });
});
