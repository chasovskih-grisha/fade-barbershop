// Специфікація вибору OTP-провайдера (T-4301): консоль — дефолт, mailpit —
// за конфігом; MailpitOtpSender шле валідний payload і кидає на HTTP-помилку.
import { MailpitOtpSender } from './mailpit-otp-sender';
import { OtpSenderFactory } from './otp-sender.factory';
import { DevOtpSender } from './dev-otp-sender';
import { HttpOtpSender } from './http-otp-sender';
import { FallbackOtpSender } from './fallback-otp-sender';

describe('OtpSenderFactory', () => {
  it('дефолт — DevOtpSender (console)', () => {
    expect(new OtpSenderFactory().build({})).toBeInstanceOf(DevOtpSender);
  });

  it('OTP_PROVIDER=mailpit → MailpitOtpSender з MAILPIT_URL', () => {
    const sender = new OtpSenderFactory().build({
      OTP_PROVIDER: 'mailpit',
      MAILPIT_URL: 'http://mp:8025',
    });
    expect(sender).toBeInstanceOf(MailpitOtpSender);
  });

  it('OTP_PROVIDER=sms → HttpOtpSender (прод-провайдер)', () => {
    const sender = new OtpSenderFactory().build({
      OTP_PROVIDER: 'sms',
      SMS_PROVIDER_URL: 'https://api.turbosms.ua/x',
      SMS_PROVIDER_TOKEN: 'tok',
    });
    expect(sender).toBeInstanceOf(HttpOtpSender);
  });

  it('sms + SMS_FALLBACK_URL → FallbackOtpSender (деградація → резерв)', () => {
    const sender = new OtpSenderFactory().build({
      OTP_PROVIDER: 'sms',
      SMS_PROVIDER_URL: 'https://api.primary/x',
      SMS_PROVIDER_TOKEN: 'p',
      SMS_FALLBACK_URL: 'https://api.reserve/x',
      SMS_FALLBACK_TOKEN: 'r',
    });
    expect(sender).toBeInstanceOf(FallbackOtpSender);
  });

  it('sms без URL/токена кидає (краще впасти, ніж мовчки піти в console)', () => {
    expect(() => new OtpSenderFactory().build({ OTP_PROVIDER: 'sms' })).toThrow('SMS_PROVIDER_URL');
  });
});

describe('MailpitOtpSender', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('шле payload у Mailpit /api/v1/send (SMS як email на sms.dev)', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ID: 'abc123' }) });
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    await new MailpitOtpSender('http://mp:8025').send('+380501234567', '123456');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://mp:8025/api/v1/send');
    const payload = JSON.parse(String(init.body)) as { To: { Email: string }[]; Text: string };
    expect(payload.To[0]?.Email).toBe('+380501234567@sms.dev');
    expect(payload.Text).toContain('123456');
  });

  it('кидає на HTTP-помилку (не мовчить)', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(
      new MailpitOtpSender('http://mp:8025').send('+380501234567', '123456')
    ).rejects.toThrow('Mailpit HTTP 500');
  });

  it('purpose booking → шаблон «для запису по телефону» (T-4409)', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ID: 'abc123' }) });
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    await new MailpitOtpSender('http://mp:8025').send('+380501234567', '654321', 'booking');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body)) as { Subject: string; Text: string };
    expect(payload.Subject).toBe('Fade — код для запису по телефону');
    expect(payload.Text).toContain('654321');
    expect(payload.Text).not.toContain('підтвердження Fade');
  });

  it('purpose login/дефолт — старий шаблон (без суфікса запису)', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ID: 'abc123' }) });
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    const sender = new MailpitOtpSender('http://mp:8025');
    await sender.send('+380501234567', '111222');
    await sender.send('+380501234567', '333444', 'login');

    const subjects = fetchMock.mock.calls.map(
      (c) => (JSON.parse(String((c[1] as RequestInit).body)) as { Subject: string }).Subject
    );
    expect(subjects).toEqual(['Fade — код підтвердження', 'Fade — код підтвердження']);
  });
});
