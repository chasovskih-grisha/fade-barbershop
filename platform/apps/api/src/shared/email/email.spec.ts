// Специфікації EmailSender (T-4408): вибір провайдера фабрикою, payload
// Mailpit, SMTP через підмінений transporter, console-дефолт.
import { ConsoleEmailSender } from './console-email.sender';
import { EmailSenderFactory } from './email-sender.factory';
import { MailpitEmailSender } from './mailpit-email.sender';
import { SmtpEmailSender } from './smtp-email.sender';

/** fetch-мок, що повертає ok з Mailpit-ID. */
const fetchOk = () => jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ID: 'x' }) });

describe('EmailSenderFactory', () => {
  // prettier-ignore
  it.each([
    ['дефолт — console', {}, ConsoleEmailSender],
    ['EMAIL_PROVIDER=mailpit → Mailpit (EMAIL_URL)', { EMAIL_PROVIDER: 'mailpit', EMAIL_URL: 'http://mp:8025' }, MailpitEmailSender],
    ['EMAIL_PROVIDER=smtp → Smtp з transporter', { EMAIL_PROVIDER: 'smtp', SMTP_URL: 'smtp://user:pass@host:587' }, SmtpEmailSender],
  ] as const)('%s', (_name, env, expected) => {
    expect(new EmailSenderFactory().build(env)).toBeInstanceOf(expected);
  });

  it('EMAIL_PROVIDER=smtp без SMTP_URL → помилка конфіга', () => {
    expect(() => new EmailSenderFactory().build({ EMAIL_PROVIDER: 'smtp' })).toThrow('SMTP_URL');
  });
});

describe('MailpitEmailSender', () => {
  afterEach(() => jest.restoreAllMocks());

  it('шле payload (To/Subject/Text/HTML) в /api/v1/send', async () => {
    const fetchMock = fetchOk();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    await new MailpitEmailSender('http://mp:8025').send({
      to: 'a@b.c',
      subject: 'Тема',
      text: 'тіло',
      html: '<b>тіло</b>',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://mp:8025/api/v1/send');
    const payload = JSON.parse(String(init.body)) as {
      From: { Email: string };
      To: { Email: string }[];
      Subject: string;
      Text: string;
      HTML: string;
    };
    expect(payload.From.Email).toBe('no-reply@dev.fade');
    expect(payload.To[0]?.Email).toBe('a@b.c');
    expect(payload.HTML).toBe('<b>тіло</b>');
  });

  it('кидає на HTTP-помилку', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 502 } as Response);
    await expect(
      new MailpitEmailSender('http://mp').send({ to: 'a@b.c', subject: 's', text: 't' })
    ).rejects.toThrow('Mailpit HTTP 502');
  });

  it('без html — поле HTML не додається (branch)', async () => {
    const fetchMock = fetchOk();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    await new MailpitEmailSender('http://mp').send({ to: 'a@b.c', subject: 's', text: 't' });

    const payload = JSON.parse(
      String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)
    ) as { HTML?: string };
    expect(payload.HTML).toBeUndefined();
  });

  it('логує не-Error кинуте як String(error) (branch)', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue('plain-string-failure' as unknown as Error);
    await expect(
      new MailpitEmailSender('http://mp').send({ to: 'a@b.c', subject: 's', text: 't' })
    ).rejects.toBe('plain-string-failure');
  });
});

describe('SmtpEmailSender', () => {
  it('шле через transporter (sendMail) і кидає на помилку', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: '<m@x>' });
    const sender = new SmtpEmailSender({ sendMail } as never, 'no-reply@fade');
    await sender.send({ to: 'a@b.c', subject: 's', text: 't' });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@b.c', from: 'no-reply@fade' })
    );

    // prettier-ignore
    const failing = new SmtpEmailSender({ sendMail: jest.fn().mockRejectedValue(new Error('relay denied')) } as never, 'f@x');
    await expect(failing.send({ to: 'a@b.c', subject: 's', text: 't' })).rejects.toThrow(
      'relay denied'
    );
  });
});
