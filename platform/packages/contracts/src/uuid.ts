// T-4300d: UUID — єдиний transport-формат ідентифікаторів у контрактах (ADR 0021).
//
// Домен генерує UUID v7 (`uuidv7()` shared kernel). Валідація навмисно ширша:
// - v7 — усе, що створює код;
// - v4 — randomUUID у тестових фікстурах і dev-даних;
// - v5 — детерміновані сід-ключі (`seedUuid('loc_KYY_01')`), на яких тримаються
//   e2e-спеки (T-4300b).
// Тобто приймаємо будь-який RFC 9562 UUID з коректним variant, але не довільний
// рядок: `loc-1` чи `"42"` у контракт не проходять.
//
// Контракти лишаються типізовані `string` (див. `Uuid`), а runtime-перевірка
// живе тут, щоб web / admin / mobile не заводили власні regex.

import { z } from 'zod';

/** Ідентифікатор доменного об'єкта в API: завжди рядок у форматі UUID. */
export type Uuid = string;

/** UUID v7 — формат, який генерує домен. */
export const UUID_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Будь-який UUID (v1–v8) з variant RFC 9562 — те, що приймаємо на вході. */
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is Uuid =>
  typeof value === 'string' && UUID_PATTERN.test(value);

export const isUuidV7 = (value: unknown): value is Uuid =>
  typeof value === 'string' && UUID_V7_PATTERN.test(value);

/** Вхідні id: v7 від домену, v4/v5 у фікстурах і сідах. */
export const uuidSchema = z.string().regex(UUID_PATTERN, 'Expected a UUID (v1–v8, RFC 9562)');

/** Для місць, де потрібен саме час-упорядкований id (сортування, курсори). */
export const uuidV7Schema = z.string().regex(UUID_V7_PATTERN, 'Expected a UUID v7');
