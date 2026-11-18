// DevOtpSender — dev-відправник: код у логах (ADR 0005 «у dev — console»).
// purpose (T-4409): 'booking' — позначка призначення в рядку лога, щоб
// розрізняти логін-коди і коди запису при налагодженні. digits у логах —
// тільки dev-канал; прод-реалізації (T-4202) логують лише факт доставки.

import { Injectable, Logger } from '@nestjs/common';
import type { OtpPurpose, OtpSender } from '../domain/ports';

@Injectable()
export class DevOtpSender implements OtpSender {
  private readonly logger = new Logger('OtpSender');

  async send(phone: string, digits: string, purpose: OtpPurpose = 'login'): Promise<void> {
    const label =
      purpose === 'booking'
        ? 'для запису по телефону'
        : purpose === 'phone_change'
          ? 'для зміни номера'
          : 'логін';
    this.logger.log(`OTP ${label} для ${phone}: ${digits}`);
  }
}
