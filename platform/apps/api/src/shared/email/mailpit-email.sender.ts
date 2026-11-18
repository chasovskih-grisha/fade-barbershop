// MailpitEmailSender — dev/test через HTTP API Mailpit-контейнера (T-4408;
// контейнер спільний із SMS-каналом T-4301, порт 19096). Листи видно в Web UI.
import { Injectable, Logger } from '@nestjs/common';
import type { EmailInput, EmailSender } from './ports';

interface MailpitSendResponse {
  ID: string;
}

@Injectable()
export class MailpitEmailSender implements EmailSender {
  private readonly logger = new Logger('EmailSender');

  constructor(
    private readonly endpoint: string,
    private readonly from = 'no-reply@dev.fade'
  ) {}

  async send(input: EmailInput): Promise<void> {
    const payload = {
      From: { Email: this.from },
      To: [{ Email: input.to }],
      Subject: input.subject,
      Text: input.text,
      ...(input.html ? { HTML: input.html } : {}),
    };
    try {
      const res = await fetch(this.endpoint + '/api/v1/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        throw new Error('Mailpit HTTP ' + res.status);
      }
      const body = (await res.json()) as MailpitSendResponse;
      this.logger.log('Email для ' + input.to + ' доставлено в Mailpit (' + body.ID + ')');
    } catch (error) {
      this.logger.error(
        'Mailpit email failed: ' + (error instanceof Error ? error.message : String(error))
      );
      throw error;
    }
  }
}
