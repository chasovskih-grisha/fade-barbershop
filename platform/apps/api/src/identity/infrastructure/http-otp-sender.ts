// HttpOtpSender — прод-адаптер OtpSender для SMS-провайдера (T-4400):
// TurboSMS-подібний HTTP API. Ключ, URL і альфа-ім'я (FADE) приходять з env
// (secret manager T-300), не з репозиторію. Контракт порту: digits ніколи не
// логуються — лог несе лише факт приймання/відмови провайдером.
import { Injectable, Logger } from '@nestjs/common';
import type { OtpPurpose, OtpSender } from '../domain/ports';
import { renderOtpText } from './otp-message';

export interface HttpOtpSenderConfig {
  url: string;
  token: string;
  sender: string;
  timeoutMs?: number;
}

@Injectable()
export class HttpOtpSender implements OtpSender {
  private readonly logger = new Logger('OtpSender');

  constructor(private readonly config: HttpOtpSenderConfig) {}

  async send(phone: string, digits: string, purpose: OtpPurpose = 'login'): Promise<void> {
    const body = {
      recipients: [phone],
      message: renderOtpText(purpose, digits),
      sender: this.config.sender,
    };
    try {
      const res = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + this.config.token,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 5000),
      });
      if (!res.ok) throw new Error('SMS provider HTTP ' + res.status);
      this.logger.log('OTP для ' + phone + ' прийнято провайдером (' + purpose + ')');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error('SMS provider send failed: ' + reason);
      throw error;
    }
  }
}
