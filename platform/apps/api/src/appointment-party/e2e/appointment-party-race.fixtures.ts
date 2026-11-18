// Фікстури race-e2e партії (T-040c/T-044): сід двох локацій — single (1 крісло:
// поріг місткості + race) і dual (2 крісла: конфлікт ноги) — барбери, сервіс
// father-son, cleanup. Спільні фікстури — @fade/test-utils (ADR 0019):
// локації/телефони/барбер-тріо/послуги — валідні номери, FK-cleanup.
import { uuidv7 } from '@fade/domain-shared';
import type { PrismaService } from '../../shared/prisma/prisma.service';
import { assignBarber, cleanupTestLocation, seedBarberUser, seedServiceWithPrices, seedTestLocation } from '@fade/test-utils';

export const DATE = '2026-11-02'; // Понеділок у моделі тижня (0 = Пн).
const uid = () => uuidv7();

export interface PartyWorld {
  barbers: Record<'b1' | 'b2', string>;
  locations: Record<'single' | 'dual', string>;
  service: string;
}

export function buildPartyWorld(): PartyWorld {
  // prettier-ignore
  return { barbers: { b1: uid(), b2: uid() }, locations: { single: uid(), dual: uid() }, service: uid() };
}

export async function seedPartyWorld(prisma: PrismaService, world: PartyWorld): Promise<void> {
  await seedBarberUser(prisma, { id: world.barbers.b1, name: 'Party Barber 1' });
  await seedBarberUser(prisma, { id: world.barbers.b2, name: 'Party Barber 2' });
  for (const [key, locationId] of Object.entries(world.locations) as Array<
    ['single' | 'dual', string]
  >) {
    // Дефолтні години (усі дні 08:00–18:00) і крісла — у спільному сіді.
    // prettier-ignore
    await seedTestLocation(prisma, { id: locationId, codePrefix: 'PTY', name: `Party race ${key}`, chairs: key === 'dual' ? 2 : 1 });
    // prettier-ignore
    await assignBarber(prisma, { locationId, barberId: world.barbers.b1, dayOfWeek: 0, window: { start: '08:00', end: '18:00' } });
    // prettier-ignore
    await assignBarber(prisma, { locationId, barberId: world.barbers.b2, dayOfWeek: 0, window: { start: '08:00', end: '18:00' } });
  }
  await seedServiceWithPrices(prisma, {
    id: world.service,
    name: `Father + son PTY ${uid().slice(-8).toUpperCase()}`,
    duration: 90,
    parallelDuration: 50,
    prices: [
      { locationId: world.locations.single, amount: 900 },
      { locationId: world.locations.dual, amount: 900 },
    ],
  });
}

export async function cleanupPartyWorld(prisma: PrismaService, world: PartyWorld): Promise<void> {
  for (const locationId of Object.values(world.locations)) {
    await cleanupTestLocation(prisma, { id: locationId }); // піддерево цілком, вкл. партії/ціни/outbox
  }
  await prisma.service.deleteMany({ where: { id: world.service } });
  await prisma.user.deleteMany({ where: { id: { in: Object.values(world.barbers) } } });
}
