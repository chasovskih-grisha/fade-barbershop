// Специфікація прод-SMS-провайдера OTP (T-4400): payload TurboSMS-подібного
// API (recipients/message/sender, Bearer), текст за призначенням коду, альфа-ім'я
// FADE, відмова провайдера не мовчить.
import { HttpOtpSender } from './http-otp-sender';
import { renderOtpText } from './otp-message';

type FetchCall = [string, RequestInit];
type FetchBody = { recipients: string[]; message: string; sender: string };

function mockFetch(ok: boolean, status = 200): jest.Mock {
  const fn = jest.fn().mockResolvedValue({ ok, status });
  jest.spyOn(globalThis, 'fetch').mockImplementation(fn);
  return fn;
}

describe('HttpOtpSender', () => {
  afterEach(() => jest.restoreAllMocks());

  it('шле OTP провайдеру: recipients, текст за purpose, альфа-ім’я, Bearer-токен', async () => {
    const fetchMock = mockFetch(true);
    const sender = new HttpOtpSender({
      url: 'https://api.turbosms.ua/message/send.json',
      token: 'secret-token',
      sender: 'FADE',
    });

    await sender.send('+380501234567', '123456', 'booking');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toBe('https://api.turbosms.ua/message/send.json');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer secret-token');
    const body = JSON.parse(String(init.body)) as FetchBody;
    expect(body.recipients).toEqual(['+380501234567']);
    expect(body.sender).toBe('FADE');
    expect(body.message).toBe('Код для запису по телефону: 123456');
  });

  it('кидає на HTTP-помилку провайдера (не мовчить)', async () => {
    mockFetch(false, 502);
    const sender = new HttpOtpSender({ url: 'https://api/x', token: 't', sender: 'FADE' });
    await expect(sender.send('+380501234567', '123456')).rejects.toThrow('SMS provider HTTP 502');
  });
});

describe('renderOtpText', () => {
  it('текст залежить від призначення коду (login — дефолт)', () => {
    expect(renderOtpText('login', '111111')).toBe('Код підтвердження Fade: 111111');
    expect(renderOtpText('phone_change', '222222')).toBe('Код для зміни номера телефону: 222222');
  });
});
