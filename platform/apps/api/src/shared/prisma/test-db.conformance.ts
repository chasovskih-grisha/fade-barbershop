// Компіляційний контракт «дуального Prisma-store»: структурний порт
// @fade/test-utils (TestDb) зобов'язаний бути надмножиною того, що реально
// вміє клієнт api. Якщо порт розійдеться зі схемою або з PrismaService,
// падає tsc саме тут — на місці, де @prisma/client є джерелом правди, а не
// e2e-фікстури трьох контекстів (appointment-party/booking/scheduling).
//
// Файл навмисно без рантайму: лише типи. Включений у tsconfig api (src/**/*),
// тож перевіряється і локальним `tsc --noEmit`, і CI.
import type { TestDb } from '@fade/test-utils';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from './prisma.service';

/** Умова, що справджується лише для true — інакше помилка на цьому рядку. */
type Assert<T extends true> = T;

/** Присвоюваність без дистрибуції по union (From — завжди один тип-джерело). */
type IsAssignable<From, To> = [From] extends [To] ? true : false;

/** Фікстури кличуть сіди з PrismaService (DI-клієнт контекстів). */
export type PrismaServiceSatisfiesTestDb = Assert<IsAssignable<PrismaService, TestDb>>;

/** Сіди з tx-клієнта: PrismaClient до нього НЕ присвоюється (тому в адаптерах
 * api й стояли приведення `as unknown as`) — а порт приймає обидві форми. */
export type TransactionClientSatisfiesTestDb = Assert<
  IsAssignable<Prisma.TransactionClient, TestDb>
>;
