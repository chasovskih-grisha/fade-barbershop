/* eslint-disable max-lines -- cohesive module (104 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Сід клієнтів (T-2104a): демо-акаунти для dev і стабільні клієнти для e2e.
// Ідентичність — тільки телефон (ADR 0005); без подій/outbox — пряме записування
// dev-даних (патерн T-012, як seed-admin.ts T-013): експорт + CLI.
// Ідемпотентність: upsert за унікальним телефоном.
//
// Налаштування:
//   FADE_SEED_CUSTOMERS_PHONE / FADE_SEED_CUSTOMERS_NAME  — один клієнт (CI/стейдж)
//   FADE_SEED_CUSTOMERS_FILE                              — шлях до JSON-масиву
//     [ { "phone": "0501112233", "name": "Олена Клієнт" }, ... ]
//     (seed:dev і seed:customers читають одне правило; якщо файл — використовуємо його.)

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from './shared/prisma/prisma.service';
import { PhoneNumber } from './identity/domain/phone-number';
import { createLogger } from './shared/seed/seed-logger';

export interface SeedCustomer {
  phone: string;
  name: string;
}

/** Демо-ростер для локальної розробки (E.164 +380… після нормалізації). */
export const DEFAULT_CUSTOMERS: readonly SeedCustomer[] = [
  { phone: '0501112233', name: 'Олена Клієнт' },
  { phone: '0502223344', name: 'Марко Постійний' },
  { phone: '0503334455', name: 'Тарас Рідко-буває' },
  { phone: '0504445566', name: 'Ірина Онлайн' },
  { phone: '0505556677', name: 'Дмитро Через-Адмінку' },
  { phone: '0506667788', name: 'Катерина VIP' },
  { phone: '0507778899', name: 'Артем Бородань' },
  { phone: '0508889900', name: 'Максим Новичок' },
];

/**
 * Різновиди налаштування клієнтів:
 *   1) FADE_SEED_CUSTOMERS_FILE — шлях до JSON-масиву { phone, name }
 *   2) FADE_SEED_CUSTOMERS_PHONE(+_NAME) — один клієнт з env
 *   3) default — 5 демо-клієнтів з DEFAULT_CUSTOMERS
 */
export function resolveSeedCustomers(): readonly SeedCustomer[] {
  const file = process.env.FADE_SEED_CUSTOMERS_FILE;
  if (file) {
    try {
      const raw = readFileSync(resolve(__dirname, file), 'utf8');
      const parsed = JSON.parse(raw) as readonly SeedCustomer[];
      if (
        !Array.isArray(parsed) ||
        parsed.some((c) => typeof c?.phone !== 'string' || typeof c?.name !== 'string')
      ) {
        throw new Error('FADE_SEED_CUSTOMERS_FILE must be an array of { phone, name } objects');
      }
      return parsed as readonly SeedCustomer[];
    } catch (err) {
      throw new Error(`FADE_SEED_CUSTOMERS_FILE "${file}" invalid: ${err}`);
    }
  }

  const envPhone = process.env.FADE_SEED_CUSTOMERS_PHONE;
  if (envPhone) {
    return [
      { phone: envPhone, name: process.env.FADE_SEED_CUSTOMERS_NAME ?? 'Тестовий клієнт (env)' },
    ];
  }

  return DEFAULT_CUSTOMERS;
}

// prettier-ignore
export type SeedCustomerSummary = { created: number; updated: number; phones: string[]; profilesCreated: number; profilesUpdated: number };

export async function seedCustomers(
  prisma: PrismaService,
  customers: readonly SeedCustomer[] = resolveSeedCustomers()
): Promise<SeedCustomerSummary> {
  let created = 0;
  let updated = 0;
  let profilesCreated = 0;
  let profilesUpdated = 0;
  const phones: string[] = [];
  for (const customer of customers) {
    const phone = PhoneNumber.of(customer.phone).value; // E.164 +380…
    const existing = await prisma.user.findUnique({ where: { phone } });
    let userId: string;
    if (existing) {
      // prettier-ignore
      await prisma.user.update({ where: { id: existing.id }, data: { name: customer.name, active: true } });
      userId = existing.id;
      updated += 1;
    } else {
      // prettier-ignore
      userId = (await prisma.user.create({ data: { id: uuidv7(), phone, name: customer.name, role: 'client', active: true, selfSchedule: false } })).id;
      created += 1;
    }
    phones.push(phone);

    // CRM-профіль (T-4606): сід гарантує ClientProfile кожному демо-клієнту;
    // vipDiscount не сіємо, лояльність рахує домен CRM (сід минає агрегати).
    // Пошук: userId (власник) → phone (профілі, створені адмінкою до сіду).
    const profile =
      (await prisma.clientProfile.findUnique({ where: { userId } })) ??
      (await prisma.clientProfile.findUnique({ where: { phone } }));
    const profileData = { name: customer.name, phone };
    if (profile) {
      await prisma.clientProfile.update({ where: { id: profile.id }, data: profileData });
      profilesUpdated += 1;
    } else {
      await prisma.clientProfile.create({ data: { id: userId, userId, ...profileData } });
      profilesCreated += 1;
    }
  }
  return { created, updated, phones, profilesCreated, profilesUpdated };
}

async function runSeedCustomersCli() {
  const logger = createLogger('seed-customers');
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const summary = await seedCustomers(prisma);
    for (const phone of summary.phones) logger.log(`customer ${phone}`);
    logger.log(
      `seed-customers: created=${summary.created} updated=${summary.updated} profiles=+${summary.profilesCreated} ~${summary.profilesUpdated}`
    );
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await logger.close();
  }
  process.exit(0);
}

if (require.main === module) {
  runSeedCustomersCli();
}
