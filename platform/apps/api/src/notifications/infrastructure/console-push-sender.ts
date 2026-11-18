// ConsolePushSender — дефолтний PushSender dev-середовища (патерн
// ConsoleEmailSender): пуші не йдуть у мережу, лише журнал із прев'ю токена.
// Реальна доставка — ExpoPushSender за PUSH_PROVIDER=expo.

import { Injectable, Logger } from '@nestjs/common';
import type { PushMessage, PushSender } from '../application/push-ports';

/** Токен у журналі не світимо повністю (це ідентифікатор пристрою). */
function mask(token: string): string {
  return token.length <= 12 ? token : `${token.slice(0, 12)}…`;
}

@Injectable()
export class ConsolePushSender implements PushSender {
  private readonly logger = new Logger('PushSender');

  async send(messages: readonly PushMessage[]): Promise<void> {
    for (const message of messages) {
      this.logger.log(`push → ${mask(message.token)} | ${message.title} | ${message.body}`);
    }
  }
}
