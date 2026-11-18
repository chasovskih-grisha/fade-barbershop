// EmailModule — спільний провайдер EmailSender за конфігом (T-4408).
// Споживачі інжектять EMAIL_SENDER токен; реальна реалізація — за
// EMAIL_PROVIDER (console/mailpit/smtp). SMTP-URL — у секретах проду.
import { Module, type Provider } from '@nestjs/common';
import { EmailSenderFactory } from './email-sender.factory';
import { EMAIL_SENDER } from './email.tokens';

const EmailSenderProvider: Provider = {
  provide: EMAIL_SENDER,
  useFactory: (factory: EmailSenderFactory) => factory.build(),
  inject: [EmailSenderFactory],
};

@Module({
  providers: [EmailSenderFactory, EmailSenderProvider],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
