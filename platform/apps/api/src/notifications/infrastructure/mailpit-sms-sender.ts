// MailpitSmsSender — SmsSender для dev/test: SMS як email на домен sms.dev,
// видно в Web UI Mailpit (патерн MailpitOtpSender identity, «SMSPitt»).
// Прод-SMS-провайдер — окремий крок (T-4202 deliverability); контракт той самий.

import { Injectable, Logger } from '@nestjs/common';
import type { SmsInput, SmsSender } from '../application/booking-confirmation-sms';

@Injectable()
export class MailpitSmsSender implements SmsSender {
  private readonly logger = new Logger('SmsSender');

  constructor(
    private readonly endpoint: string,
    private readonly from = 'confirm@sms.dev'
  ) {}

  async send(input: SmsInput): Promise<void> {
    const payload = {
      From: { Email: this.from },
      To: [{ Email: input.to + '@sms.dev', Name: 'SMS ' + input.to }],
      Subject: 'Fade — підтвердження запису',
      Text: input.text,
    };
    try {
      const res = await fetch(this.endpoint + '/api/v1/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) throw new Error('Mailpit HTTP ' + res.status);
    } catch (error) {
      this.logger.error(
        'Mailpit SMS send failed: ' + (error instanceof Error ? error.message : String(error))
      );
      throw error;
    }
  }
}
