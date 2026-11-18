// Специфікація FallbackOtpSender (T-4400): деградація основного провайдера —
// резерв доставляє; обидва впали — кидаємо (use case дозволить повтор).
import { FallbackOtpSender } from './fallback-otp-sender';
import type { OtpSender } from '../domain/ports';

function sender(impl: () => Promise<void>): OtpSender & { send: jest.Mock } {
  return { send: jest.fn(impl) };
}

describe('FallbackOtpSender', () => {
  it('основний доставив — резерв не викликається', async () => {
    const primary = sender(async () => undefined);
    const reserve = sender(async () => undefined);
    await new FallbackOtpSender(primary, reserve).send('+380501234567', '123456');
    expect(primary.send).toHaveBeenCalledTimes(1);
    expect(reserve.send).not.toHaveBeenCalled();
  });

  it('основний упав — резерв доставляє (вхід не ламається)', async () => {
    const primary = sender(async () => {
      throw new Error('provider down');
    });
    const reserve = sender(async () => undefined);
    await new FallbackOtpSender(primary, reserve).send('+380501234567', '123456', 'login');
    expect(reserve.send).toHaveBeenCalledWith('+380501234567', '123456', 'login');
  });

  it('обидва впали — кидаємо (помилка видима use case-у)', async () => {
    const primary = sender(async () => {
      throw new Error('primary down');
    });
    const reserve = sender(async () => {
      throw new Error('reserve down');
    });
    await expect(
      new FallbackOtpSender(primary, reserve).send('+380501234567', '123456')
    ).rejects.toThrow('reserve down');
  });
});
