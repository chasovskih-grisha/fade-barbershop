// Фікстури GWT e2e флоу запису (T-041): сід за booking-flow-tests.md — активна
// локація (2 крісла, 09:00–20:00, середа вихідний), вимкнена стара локація,
// послуги з цінами локації + вимкнена «Догляд», призначені барбери +
// чужолокаційний, обидва крісла зайняті 14:00–15:30 у тестовий день.
// Спільні фікстури — @fade/test-utils (ADR 0019): локації, барбери, послуги.
import { uuidv7 } from '@fade/domain-shared';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import {
  assignBarber,
  cleanupTestLocation,
  seedBarberUser,
  seedRawBooking,
  seedServiceWithPrices,
  seedTestLocation,
} from '@fade/test-utils';

export const GWT_DATE = '2026-11-03'; // вівторок (dayOfWeek 1 у конвенції коду)

export function buildGwtIds() {
  // prettier-ignore
  return { location: uuidv7(), locationOld: uuidv7(), barberA: uuidv7(), barberB: uuidv7(), barberOther: uuidv7(), service: uuidv7(), serviceCare: uuidv7(), serviceParty: uuidv7() };
}

export type GwtIds = ReturnType<typeof buildGwtIds>;

export async function seedGwt(prisma: PrismaService, ids: GwtIds): Promise<void> {
  const suffix = uuidv7().slice(-4);
  // Локації — спільний сід: disabled «стара» теж (active: false); середа closed.
  // prettier-ignore
  const closedWednesday = [...[0, 1, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, open: '09:00', close: '20:00', closed: false })), { dayOfWeek: 2, open: null, close: null, closed: true }];
  // prettier-ignore
  await seedTestLocation(prisma, { id: ids.location, codePrefix: 'GWT-01', name: 'Fade GWT', chairs: 2, hours: closedWednesday });
  // prettier-ignore
  await seedTestLocation(prisma, { id: ids.locationOld, codePrefix: 'GWT-OLD', name: 'Fade Old', chairs: 1, active: false });
  // T-4522: політика слотів із великим горизонтом — GWT_DATE поза дефолтним
  // 14-денним вікном (фіксована тестова дата ≈ місяць у майбутньому);
  // крок/буфер/last-minute — дефолтні, щоб стрічка тесту не змінювалася.
  await prisma.locationSlotPolicy.create({
    data: {
      id: uuidv7(),
      locationId: ids.location,
      stepMinutes: 15,
      bufferMinutes: 0,
      horizonDays: 365,
      lastMinuteMinutes: 60,
    },
  });
  await seedBarberUser(prisma, { id: ids.barberA, name: 'Олексій' });
  await seedBarberUser(prisma, { id: ids.barberB, name: 'Дмитро' });
  await seedBarberUser(prisma, { id: ids.barberOther, name: 'Чужий' });
  await seedServiceWithPrices(prisma, {
    id: ids.service,
    name: `Стрижка GWT ${suffix}`,
    duration: 50,
    sortOrder: 1,
    prices: [{ locationId: ids.location, amount: 600 }],
  });
  // prettier-ignore
  await seedServiceWithPrices(prisma, { id: ids.serviceCare, name: `Догляд GWT ${suffix}`, duration: 40, active: false, sortOrder: 2, prices: [{ locationId: ids.location, amount: 500, active: false }] });
  // prettier-ignore
  await seedServiceWithPrices(prisma, { id: ids.serviceParty, name: `Батько + син GWT ${suffix}`, duration: 90, parallelDuration: 50, sortOrder: 3, prices: [{ locationId: ids.location, amount: 900 }] });
  // «Олексій працює 09:00–18:00» у вівторок (екран 3) — графіки обох барберів;
  // чужолокаційному віконце не потрібне (лише призначення).
  // prettier-ignore
  await assignBarber(prisma, { locationId: ids.location, barberId: ids.barberA, dayOfWeek: 1, window: { start: '09:00', end: '18:00' } });
  // prettier-ignore
  await assignBarber(prisma, { locationId: ids.location, barberId: ids.barberB, dayOfWeek: 1, window: { start: '09:00', end: '18:00' } });
  await assignBarber(prisma, { locationId: ids.locationOld, barberId: ids.barberOther });
  // Обидва крісла зайняті 14:00–15:30 у тестовий день (сирий рядок — перешкода).
  // prettier-ignore
  await seedRawBooking(prisma, { locationId: ids.location, barberId: uuidv7(), start: new Date(`${GWT_DATE}T14:00:00.000Z`), end: new Date(`${GWT_DATE}T15:30:00.000Z`) });
  // prettier-ignore
  await seedRawBooking(prisma, { locationId: ids.location, barberId: uuidv7(), start: new Date(`${GWT_DATE}T14:00:00.000Z`), end: new Date(`${GWT_DATE}T15:30:00.000Z`) });
}

export async function cleanupGwt(prisma: PrismaService, ids: GwtIds): Promise<void> {
  // Піддерева обох локацій (booking/party/price/assignment/window/hours/chair)
  // — FK-впорядкований cleanup у спільному хелпері; далі послуги та барбери.
  await cleanupTestLocation(prisma, { id: ids.location });
  await cleanupTestLocation(prisma, { id: ids.locationOld });
  // T-4522: політика слотів — без FK на Location, прибираємо окремо.
  await prisma.locationSlotPolicy.deleteMany({
    where: { locationId: { in: [ids.location, ids.locationOld] } },
  });
  // prettier-ignore
  await prisma.service.deleteMany({ where: { id: { in: [ids.service, ids.serviceCare, ids.serviceParty] } } });
  // prettier-ignore
  await prisma.user.deleteMany({ where: { id: { in: [ids.barberA, ids.barberB, ids.barberOther] } } });
}
