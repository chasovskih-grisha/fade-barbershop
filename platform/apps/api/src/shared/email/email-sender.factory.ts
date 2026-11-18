// EmailSenderFactory — вибір реалізації за конфігом (T-4408, патерн ADR 0050):
// EMAIL_PROVIDER=console (дефолт) | mailpit (EMAIL_URL, дев Web UI 19096) | smtp.
import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { ConsoleEmailSender } from './console-email.sender';
import { MailpitEmailSender } from './mailpit-email.sender';
import { SmtpEmailSender } from './smtp-email.sender';
import type { EmailSender, EmailProviderName } from './ports';

@Injectable()
export class EmailSenderFactory {
  build(
    env: {
      EMAIL_PROVIDER?: string;
      EMAIL_URL?: string;
      MAILPIT_URL?: string;
      SMTP_URL?: string;
      EMAIL_FROM?: string;
    } = process.env
  ): EmailSender {
    const provider = (env.EMAIL_PROVIDER ?? 'console') as EmailProviderName;
    if (provider === 'mailpit') {
      return new MailpitEmailSender(env.EMAIL_URL ?? env.MAILPIT_URL ?? 'http://localhost:19096');
    }
    if (provider === 'smtp') {
      if (!env.SMTP_URL) throw new Error('EMAIL_PROVIDER=smtp потребує SMTP_URL');
      const transporter = createTransport(env.SMTP_URL);
      return new SmtpEmailSender(transporter, env.EMAIL_FROM ?? 'no-reply@fade.com.ua');
    }
    return new ConsoleEmailSender();
  }
}
