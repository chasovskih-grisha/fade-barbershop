// PushSenderFactory — вибір реалізації push-каналу (патерн EmailSenderFactory):
// PUSH_PROVIDER=console (дефолт dev, нічого не йде в мережу) | expo (prod).

import { Injectable } from '@nestjs/common';
import { ConsolePushSender } from './console-push-sender';
import { ExpoPushSender } from './expo-push-sender';
import type { PushProviderName, PushSender } from '../application/push-ports';

@Injectable()
export class PushSenderFactory {
  build(env: { PUSH_PROVIDER?: string } = process.env): PushSender {
    const provider = (env.PUSH_PROVIDER ?? 'console') as PushProviderName;
    return provider === 'expo' ? new ExpoPushSender() : new ConsolePushSender();
  }
}
