// RegisterPushToken (T-070 mobile / T-4422 безпека): пристрій реєструє
// Expo-токен — і з цієї миті канал сповіщень «дозволений» (дозвіл видає ОС,
// тож окремого прапорця згоди немає). Токен унікальний глобально: повторна
// реєстрація тим самим апаратом (перелогін, зміна користувача на пристрої)
// переносить рядок на нову сесію, а не плодить другий.
// Події тут не емітуємо: реєстрація каналу не змінює стан акаунта (лист/пуш
// про це не потрібні) — на відміну від нового входу (identity.session.started).

import { PushToken } from '../domain/push-token';
import type { Clock, IdGenerator, PushTokenRepository, UnitOfWork } from '../domain/ports';

export interface RegisterPushTokenResult {
  ok: true;
}

export class RegisterPushTokenHandler {
  constructor(
    private readonly deps: {
      tokens: PushTokenRepository;
      ids: IdGenerator;
      clock: Clock;
      uow: UnitOfWork;
    }
  ) {}

  handle(input: {
    userId: string;
    sessionId: string;
    token: string;
    /** exactOptionalPropertyTypes: поле може бути відсутнім або явно undefined. */
    platform?: string | undefined;
  }): Promise<RegisterPushTokenResult> {
    const { tokens, ids, clock, uow } = this.deps;
    return uow.run(async (): Promise<RegisterPushTokenResult> => {
      const now = clock.now();
      const normalized = PushToken.normalizeToken(input.token);
      const existing = await tokens.findByToken(normalized);
      if (existing) {
        // Той самий апарат: переприв'язуємо до поточної сесії (активуємо назад,
        // якщо канал був вимкнений) — інакше пуш пішов би на мертву сесію.
        existing.rebind({
          userId: input.userId,
          sessionId: input.sessionId,
          platform: PushToken.normalizePlatform(input.platform),
          at: now,
        });
        await tokens.save(existing);
        return { ok: true };
      }
      await tokens.save(
        PushToken.register({
          id: ids.id(),
          userId: input.userId,
          sessionId: input.sessionId,
          token: normalized,
          platform: PushToken.normalizePlatform(input.platform),
          at: now,
        })
      );
      return { ok: true };
    });
  }
}
