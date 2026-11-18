// In-memory Prisma-фейк для PrismaLoginAudit (T-4411). Головна пастка спеки:
// якби адаптер писав у tx-клієнт, рядок відкочувався б разом із транзакцією —
// тому $transaction тут мокається так, що tx-клієнт пише в ОКРЕМУ мапу, яка
// відкидається після помилки (стара реалізація currentDb цей тест би провалила).
import type { PrismaService } from '../../shared/prisma/prisma.service';

type Row = { key: string; value: unknown };

/** baseMap — «зафіксовані» дані; tx-клієнт пише в окрему мапу й відкидається. */
export function makePrisma() {
  const baseMap = new Map<string, unknown>();
  const rows = (map: Map<string, unknown>) => ({
    findUnique: async ({ where }: { where: { key: string } }) => {
      const key = where.key;
      return map.has(key) ? ({ key, value: map.get(key) } as Row) : null;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { key: string };
      create: Row;
      update: Row;
    }) => {
      map.set(where.key, map.has(where.key) ? update.value : create.value);
      return { ...create };
    },
  });
  const prisma = {
    appSetting: rows(baseMap),
    $transaction: async <T>(work: (tx: unknown) => Promise<T>): Promise<T> =>
      work(rows(new Map<string, unknown>())),
  };
  return { prisma: prisma as unknown as PrismaService, baseMap };
}
