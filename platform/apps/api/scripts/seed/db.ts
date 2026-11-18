import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
// scripts/seed/db.ts → ../../src (шлях відносно scripts/seed/, не scripts/).
import { logger } from '../../src/shared/seed/seed-logger';

export const FIXED_IDS = process.env.FADE_SEED_FIXED_IDS === '1';

// Тип параметра беремо з самого конструктора згенерованого клієнта:
// PrismaClientOptions з runtime/library має інший union isolationLevel і
// не проходить у Subset. Явне undefined у неопційному полі теж відсікаємо —
// datasources передаємо лише коли DATABASE_URL немає.
type PrismaClientArgs = ConstructorParameters<typeof PrismaClient>[0];

const clientOptions: PrismaClientArgs = process.env.DATABASE_URL
  ? {}
  : {
      datasources: {
        db: { url: 'postgresql://barbershop:barbershop@localhost:15432/barbershop?schema=public' },
      },
    };

export const prisma = new PrismaClient(clientOptions);

/**
 * Детермінований UUID із читабельного ключа сіду (T-4300b): PK — uuid-колонка,
 * тож id виду `loc_KYY_01` у БД не пройде. sha1(key) → 16 байт, version 5,
 * variant RFC 4122 — той самий результат у Playwright-фікстурах
 * (apps/web/e2e/seed-ids.ts), бо ключ однаковий.
 */
export function seedUuid(key: string): string {
  const hex = createHash('sha1').update(key).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  hex[16] = ((parseInt(hex[16] ?? '0', 16) & 0x3) | 0x8).toString(16);
  const h = hex.join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Детерміновані id для e2e (лише у FIXED_IDS-режимі). */
export const id = (v: string | undefined) => (FIXED_IDS && v ? seedUuid(v) : undefined);

/** Конфлікт id: якщо рядок з таким кодом/телефоном ВЖЄ існує з іншим id —
 * upsert створив би дублікат коду (unique) або тихо оновив чужий рядок.
 * У FIXED_IDS-режимі це помилка конфігурації середовища: спершу reset. */
export async function idConflict(
  model: string,
  uniqueWhere: Record<string, unknown>,
  key: string | undefined
) {
  // Індекс по PrismaClient не має підпису індексу — мапимо явно на delegate.
  const delegate = (
    prisma as unknown as Record<
      string,
      { findUnique: (args: { where: Record<string, unknown> }) => Promise<{ id?: string } | null> }
    >
  )[model];
  if (!delegate) throw new Error(`[seed] невідома модель Prisma: ${model}`);
  const existing = await delegate.findUnique({ where: uniqueWhere });
  if (existing && FIXED_IDS && existing.id !== key) {
    throw new Error(
      `[seed] ${model}: рядок ${JSON.stringify(uniqueWhere)} вже існує з id="${existing.id}", очікувався "${key}". ` +
        'Запусти `pnpm seed:e2e` (reset + фіксовані id) або зніми FADE_SEED_FIXED_IDS.'
    );
  }
  return existing;
}

/** Спільний ранер: помилка → exit 1, у фіналі — закриття з'єднання. */
export const runSeed = (main: () => Promise<void>) =>
  main()
    .catch((e) => {
      logger.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
