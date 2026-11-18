// FallbackOtpSender (T-4400): основний провайдер → резервний. Деградація
// основного — сигнал (error-лог для алерту T-4204), а не відмова входу: якщо
// резерв доставив, клієнт отримує код. Обидва впали — кидаємо, use case
// показує помилку і дозволяє повтор (клієнт не лишається без шляху).
import { Injectable, Logger } from '@nestjs/common';
import type { OtpPurpose, OtpSender } from '../domain/ports';

@Injectable()
export class FallbackOtpSender implements OtpSender {
  private readonly logger = new Logger('OtpSender');

  constructor(
    private readonly primary: OtpSender,
    private readonly reserve: OtpSender
  ) {}

  async send(phone: string, digits: string, purpose: OtpPurpose = 'login'): Promise<void> {
    try {
      await this.primary.send(phone, digits, purpose);
    } catch {
      this.logger.error('Основний SMS-провайдер недоступний — перехід на резервний');
      await this.reserve.send(phone, digits, purpose);
    }
  }
}
