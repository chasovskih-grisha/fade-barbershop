// ConsoleEmailSender — dev-дефолт: лист у логах (дух ADR 0005 «у dev — console»).
import { Injectable, Logger } from '@nestjs/common';
import type { EmailInput, EmailSender } from './ports';

@Injectable()
export class ConsoleEmailSender implements EmailSender {
  private readonly logger = new Logger('EmailSender');

  async send(input: EmailInput): Promise<void> {
    this.logger.log(`Email для ${input.to}: ${input.subject} — ${input.text}`);
  }
}
