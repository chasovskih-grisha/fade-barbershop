// T-4300e: id тестових об'єктів — UUID v7 зі shared kernel, а не читабельні
// константи (`u-1`, `s-web`): після T-4300b БД приймає лише uuid, і тест на
// `'loc-1'` маскував би невиконану міграцію (ADR 0021).
//
// Модуль імпортується один раз на тестовий файл (Jest module registry), тому
// константи стабільні в межах файлу й спільні для фейків і спеків: `seedUser`
// кладе користувача з `USER_1`, а спека шукає його ж за `USER_1`. Між файлами
// значення різні — жоден тест не покладається на конкретний рядок.
import { uuidv7 } from '@fade/domain-shared';

export const USER_1 = uuidv7();
export const USER_2 = uuidv7();
export const USER_3 = uuidv7();

export const SESSION_WEB = uuidv7();
export const SESSION_MOBILE = uuidv7();
export const SESSION_1 = uuidv7();
export const SESSION_2 = uuidv7();
export const SESSION_LIVE = uuidv7();
export const SESSION_MINE = uuidv7();
export const SESSION_OLD = uuidv7();
export const SESSION_NEW = uuidv7();

export const CHALLENGE_1 = uuidv7();

/** Клієнтський профіль (CRM) і його користувач — identity-контролери/харнеси. */
export const USER_CLIENT = uuidv7();
export const PROFILE_1 = uuidv7();
export const SESSION_CLIENT = uuidv7();

/** Новий UUID v7 там, де тесту потрібен «ще один» id без фіксованої назви. */
export const testId = (): string => uuidv7();

/**
 * Формат UUID v7 для перевірок у спеках (той самий, що `UUID_V7_PATTERN`
 * у `@fade/contracts`). Локальна копія — бо jest резолвить пакет у застарілі
 * скомпільовані `src/*.js`, які перекривають TS-джерело при runtime-імпорті.
 */
export const UUID_V7_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
