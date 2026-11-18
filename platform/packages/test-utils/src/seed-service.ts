// Сід послуги з цінами локацій одним викликом — дублювання gwt/party сюїт.
// prettier-ignore біля даних (ADR 0019).
import { uuidv7 } from '@fade/domain-shared';
import type { TestDb } from './db-port';

export interface ServicePriceInput {
  locationId: string;
  amount: number;
  active?: boolean;
}

/** Service + ServicePrice-рядки по локаціях. parallelDuration — для
 * father-son послуг (паралельне обслуговування), null — звичайна. */
export async function seedServiceWithPrices(
  prisma: TestDb,
  input: {
    id?: string;
    name: string;
    duration: number;
    parallelDuration?: number | null;
    active?: boolean;
    /** Позиція в каталозі: багатосервісні сіди мають фіксувати порядок. */
    sortOrder?: number;
    prices: ServicePriceInput[];
  }
): Promise<string> {
  const id = input.id ?? uuidv7();
  await prisma.service.create({
    data: {
      id,
      name: input.name,
      duration: input.duration,
      parallelDuration: input.parallelDuration ?? null,
      active: input.active ?? true,
      sortOrder: input.sortOrder ?? 0,
      prices: {
        // prettier-ignore
        create: input.prices.map((p) => ({ id: uuidv7(), locationId: p.locationId, amount: p.amount, active: p.active ?? true })),
      },
    },
  });
  return id;
}
