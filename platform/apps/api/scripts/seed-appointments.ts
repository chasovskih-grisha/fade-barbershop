// Сід записів (T-2104c): демо-бронювання у всіх статусах життєвого циклу
// (booked/confirmed/in_progress/completed/cancelled/no_show) і всіх джерелах
// (T-046: web/admin/walk_in/mobile). Читає довідники, створені seed-dev.ts,
// і клієнтів seed-customers.ts — тому запускається ПІСЛЯ них (пайплайн
// `pnpm seed` і db-seed у compose дбають про порядок).
//
// Ідемпотентність: upsert за детермінованим appointmentId (apt_seed_NNN).
// Час placer'а ковзає разом із «зараз», тож демо-дані для аналітики актуальні.
// Подій в outbox не пишемо — пряме записування dev-даних (T-012/T-2104a).
// Інваріанти: end-start = тривалість послуги (slot-validator), у минулому —
// лише закриті статуси, cancelReason тільки у cancelled (aggregate).
//
// Запуск: `pnpm seed:appointments` (окремо) або у складі `pnpm seed`.
// FADE_SEED_FIXED_IDS=1 → читабельні id (bk_seed_01 / apt_seed_01).
// FADE_SEED_REQUIRE_CLIENTS=1 → відсутність клієнтів = помилка конфігурації
// (fresh-середовища); дефолт — толерантний режим (клієнти опційні).

import { FIXED_IDS, prisma, runSeed } from './seed/db';
import { appointmentPlan, upsertBooking } from './seed/appointments';
import { logger } from '../src/shared/seed/seed-logger';

/** Довідники з seed-dev/seed-customers; помилка конфігурації, якщо порожньо. */
async function loadRefs() {
  const [locations, barbers, services, customers] = await Promise.all([
    prisma.location.findMany({ where: { active: true }, orderBy: { code: 'asc' } }),
    prisma.user.findMany({ where: { role: 'barber', active: true }, orderBy: { phone: 'asc' } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.user.findMany({ where: { role: 'client', active: true }, orderBy: { phone: 'asc' } }),
  ]);
  if (!locations.length || !barbers.length || !services.length) {
    throw new Error(
      '[seed-appointments] порожні довідники — спершу запусти `pnpm seed:dev` (і `pnpm seed:customers`)'
    );
  }
  if (process.env.FADE_SEED_REQUIRE_CLIENTS === '1' && !customers.length) {
    throw new Error(
      '[seed-appointments] немає клієнтів — спершу запусти `pnpm seed:customers` (або прибери FADE_SEED_REQUIRE_CLIENTS)'
    );
  }
  return { locations, barbers, services, customers };
}

async function main() {
  if (FIXED_IDS) logger.log('seed-appointments: FIXED-IDS режим');
  const refs = await loadRefs();
  // Розкладка по барберах/локаціях циклічна — обидва барбери обидвох локацій.
  const rows = appointmentPlan(refs);
  let created = 0;
  let updated = 0;
  for (const [i, row] of rows.entries()) {
    if ((await upsertBooking(refs, i, row)) === 'created') created += 1;
    else updated += 1;
  }
  await printSummary(created, updated);
}

/** Підсумок: лічильники + розподіл за статусами (для налагодження/e2e). */
async function printSummary(created: number, updated: number) {
  logger.log(`seed-appointments: created=${created} updated=${updated}`);
  const byStatus = await prisma.booking.groupBy({
    by: ['status'],
    _count: true,
    where: { appointmentId: { startsWith: 'apt_seed_' } },
  });
  for (const g of byStatus) logger.log(`  ${g.status}: ${g._count}`);
  logger.log('done');
}

runSeed(main);
