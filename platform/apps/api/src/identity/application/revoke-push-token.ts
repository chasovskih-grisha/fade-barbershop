// RevokePushToken (T-070/T-4422): вимкнути канал сповіщень для конкретного
// пристрою (клієнт виходить з акаунта, вимикає пуші). Ідемпотентно: невідомий
// токен або вже вимкнений — ok без помилки (клієнт не має боротися з 404).
// Токен чужого користувача не чіпаємо (у репозиторії — WHERE userId).

import type { Clock, PushTokenRepository, UnitOfWork } from '../domain/ports';

export interface RevokePushTokenResult {
  ok: true;
  revoked: boolean;
}

export class RevokePushTokenHandler {
  constructor(
    private readonly deps: { tokens: PushTokenRepository; clock: Clock; uow: UnitOfWork }
  ) {}

  handle(input: { userId: string; token: string }): Promise<RevokePushTokenResult> {
    const { tokens, clock, uow } = this.deps;
    return uow.run(async (): Promise<RevokePushTokenResult> => {
      const token = input.token.trim();
      if (token.length === 0) return { ok: true, revoked: false };
      const revoked = await tokens.revokeByToken(token, input.userId, clock.now());
      return { ok: true, revoked };
    });
  }
}
