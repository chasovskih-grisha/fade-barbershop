// MailpitOtpSender — OtpSender через HTTP API Mailpit-контейнера (T-4301,
// дзеркало T-4408 email): dev/test «SMSPitt» — SMS як email на домен sms.dev,
// видно в Web UI Mailpit. Транспорт — fetch із Node 20, timeout 3s.
// purpose (T-4409, T-4620a): 'booking' — шаблон із суфіксом «для запису по
// телефону», 'phone_change' — «для зміни номера телефону», щоб клієнт знав,
// навіщо код (і не передавав його як логін-код). digits ніколи не логуються —
// лише тіло повідомлення.
import { Injectable, Logger } from '@nestjs/common';
import type { OtpPurpose, OtpSender } from '../domain/ports';
import { renderOtpText } from './otp-message';

interface MailpitSendResponse {
  ID: string;
}

const SUBJECTS: Record<OtpPurpose, string> = {
  login: 'Fade — код підтвердження',
  booking: 'Fade — код для запису по телефону',
  phone_change: 'Fade — код для зміни номера телефону',
};

@Injectable()
export class MailpitOtpSender implements OtpSender {
  private readonly logger = new Logger('OtpSender');

  constructor(
    private readonly endpoint: string,
    private readonly from = 'otp@sms.dev'
  ) {}

  async send(phone: string, digits: string, purpose: OtpPurpose = 'login'): Promise<void> {
    const payload = {
      From: { Email: this.from },
      To: [{ Email: phone + '@sms.dev', Name: 'SMS ' + phone }],
      Subject: SUBJECTS[purpose] ?? SUBJECTS.login,
      Text: renderOtpText(purpose, digits),
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
      this.logger.log('OTP для ' + phone + ' доставлено в Mailpit (' + body.ID + ')');
    } catch (error) {
      this.logger.error(
        'Mailpit send failed: ' + (error instanceof Error ? error.message : String(error))
      );
      throw error;
    }
  }
}
