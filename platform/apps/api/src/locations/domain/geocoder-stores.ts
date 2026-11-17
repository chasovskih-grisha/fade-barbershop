// Порти сховищ для декоратора кешу/лімітів геокодера (доменна межа):
// інфраструктура (in-process Map або Redis) реалізує їх, декоратор — ніколи
// не знає, де лежать дані. Семантика свідомо вузька — саме те, що потрібен
// декоратору, і нічого зайвого.

/** Місто/порожня відповідь провайдера з моментом закінчення свіжості. */
export interface CachedCity {
  /** null = провайдер чесно сказав «міста тут немає» — кешуємо як валідну відповідь. */
  readonly city: string | null;
  /** epoch ms, після якого запис вважається застарілим. */
  readonly expiresAt: number;
}

/** Сховище відповідей геокодера: ключ → CachedCity. */
export interface GeocoderCacheStore {
  get(key: string): Promise<CachedCity | null>;
  /** TTL у мс; сховищу заборонено зберігати «назавжди» — максимум обмежує адаптер. */
  set(key: string, value: CachedCity, ttlMs: number): Promise<void>;
}

/** Атомарний слот лімітів: повертає true, якщо виклик у межах ліміту. */
export interface GeocoderRateLimitStore {
  /** Ковзне вікно з атомарним захопленням слота. */
  tryAcquire(input: {
    key: string;
    max: number;
    windowMs: number;
    nowMs: number;
  }): Promise<boolean>;
}

/** Надгробок: після серії збоїв провайдер мовчить N мс — спільно для всіх інстансів. */
export interface GeocoderTombstoneStore {
  /** true — зараз під надгробком (зважаючи на попередні recordFailure). */
  isTombstoned(key: string, nowMs: number): Promise<boolean>;
  recordFailure(input: {
    key: string;
    nowMs: number;
    threshold: number;
    durationMs: number;
  }): Promise<void>;
  recordSuccess(key: string): Promise<void>;
}
