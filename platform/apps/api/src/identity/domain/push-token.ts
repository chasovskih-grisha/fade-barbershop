// PushToken (T-070 mobile / T-4422 безпека) — канал сповіщень пристрою.
// Токен Expo прив'язаний до сесії (пристрій = сесія): «пуш на інші пристрої»
// = токени інших сесій, а revoke сесії закриває її канал. Дозвіл на пуш дає
// ОС, тому окремого прапорця згоди немає — реєстрація токена І Є дозволом.

import { InvalidPushTokenError } from '../application/identity-errors';

export type PushPlatform = 'ios' | 'android' | 'web';

const PLATFORMS: readonly PushPlatform[] = ['ios', 'android', 'web'];
const TOKEN_MAX = 255;
/** Expo-токени: ExponentPushToken[...] (legacy) і ExpoPushToken[...]. */
const EXPO_TOKEN_RE = /^Expo(nent)?PushToken\[[^\]]+\]$/;

export interface PushTokenData {
  id: string;
  userId: string;
  sessionId: string;
  token: string;
  platform: PushPlatform;
  createdAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
}

export class PushToken {
  private constructor(private readonly data: PushTokenData) {}

  static fromData(data: PushTokenData): PushToken {
    return new PushToken(data);
  }

  /** Нормалізує і валідує токен; невірна форма — доменна помилка (400). */
  static normalizeToken(raw: string): string {
    const token = raw.trim();
    if (token.length === 0 || token.length > TOKEN_MAX || !EXPO_TOKEN_RE.test(token)) {
      throw new InvalidPushTokenError();
    }
    return token;
  }

  static normalizePlatform(raw: string | undefined): PushPlatform {
    return PLATFORMS.includes(raw as PushPlatform) ? (raw as PushPlatform) : 'ios';
  }

  static register(input: {
    id: string;
    userId: string;
    sessionId: string;
    token: string;
    platform: PushPlatform;
    at: Date;
  }): PushToken {
    return new PushToken({
      id: input.id,
      userId: input.userId,
      sessionId: input.sessionId,
      token: PushToken.normalizeToken(input.token),
      platform: PushToken.normalizePlatform(input.platform),
      createdAt: input.at,
      lastSeenAt: input.at,
      revokedAt: null,
    });
  }

  get id(): string {
    return this.data.id;
  }
  get userId(): string {
    return this.data.userId;
  }
  get sessionId(): string {
    return this.data.sessionId;
  }
  get token(): string {
    return this.data.token;
  }
  get platform(): PushPlatform {
    return this.data.platform;
  }
  get createdAt(): Date {
    return this.data.createdAt;
  }
  get lastSeenAt(): Date {
    return this.data.lastSeenAt;
  }
  get active(): boolean {
    return this.data.revokedAt === null;
  }
  get revokedAt(): Date | null {
    return this.data.revokedAt;
  }

  /** Той самий апарат перелогінився: переносимо токен на нову сесію
   * (id рядка не змінюємо — це та сама фізична реєстрація каналу). */
  rebind(input: { userId: string; sessionId: string; platform: PushPlatform; at: Date }): void {
    this.data.userId = input.userId;
    this.data.sessionId = input.sessionId;
    this.data.platform = input.platform;
    this.data.lastSeenAt = input.at;
    this.data.revokedAt = null;
  }

  /** Відкликати канал (вимкнені сповіщення / вихід). true — стан змінився. */
  revoke(at: Date): boolean {
    if (this.data.revokedAt !== null) return false;
    this.data.revokedAt = at;
    return true;
  }
}
