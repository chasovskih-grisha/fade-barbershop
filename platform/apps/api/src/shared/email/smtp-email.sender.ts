// SmtpEmailSender — прод-реалізація (T-4202): nodemailer з transport,
// інжектованим у конструктор (тестопридатно: юніт-тест підмінює transporter).
import { Injectable, Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import type { EmailInput, EmailSender } from './ports';

@Injectable()
export class SmtpEmailSender implements EmailSender {
  private readonly logger = new Logger('EmailSender');

  constructor(
    private readonly transporter: Transporter,
    private readonly from: string
  ) {}

  async send(input: EmailInput): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      });
      this.logger.log(
        'Email для ' + input.to + ' відправлено через SMTP (' + String(info.messageId) + ')'
      );
    } catch (error) {
      this.logger.error(
        'SMTP email failed: ' + (error instanceof Error ? error.message : String(error))
      );
      throw error;
    }
  }
}
