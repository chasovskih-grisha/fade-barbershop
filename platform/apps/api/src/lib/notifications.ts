import { Logger } from '@nestjs/common';
// Тонкий шар push-сповіщень для сервісів, що працюють поза Nest DI.
// Реальна доставка делегується sender-у (Expo push у проді, консоль у тестах).
export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushSender {
  send(payload: PushPayload): Promise<void>;
}

const consoleSender: PushSender = {
  async send(payload) {
    Logger.log(`[push] ${payload.title}: ${payload.body}`, 'Push');
  },
};

let activeSender: PushSender = consoleSender;

/** Замінює доставку (тести, Expo-канал у composition root). */
export function setPushSender(sender: PushSender): void {
  activeSender = sender;
}

/** Поточний sender — те, що реально відправляє повідомлення. */
export function usePush(): PushSender {
  return activeSender;
}

export const push: PushSender = {
  send(payload) {
    return activeSender.send(payload);
  },
};
