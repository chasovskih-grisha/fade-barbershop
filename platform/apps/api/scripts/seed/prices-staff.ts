import { uuidv7 } from '@fade/domain-shared';
import { idConflict, prisma } from './db';
import { BARBER_WEEK } from './data-locations';

// Явні типи параметрів: без них noImplicitAny ламав компіляцію сіду.
type PriceLocation = { id: string; code: string };
type SeededService = { service: { id: string }; prices: { kyy: number; lvi: number } };
type BarberSeed = (typeof import('./data-catalog'))['BARBERS'][number];

/** Ціни послуг за локацією: upsert за (serviceId, locationId). */
export async function seedServicePrices(location: PriceLocation, services: SeededService[]) {
  const prefix = location.code.toLowerCase().startsWith('lvi') ? 'lvi' : 'kyy';
  for (const s of services) {
    const data = {
      serviceId: s.service.id,
      locationId: location.id,
      amount: s.prices[prefix],
      active: true,
    };
    const existing = await prisma.servicePrice.findFirst({
      where: { serviceId: s.service.id, locationId: location.id },
    });
    if (existing) {
      await prisma.servicePrice.update({
        where: { id: existing.id },
        data: { amount: data.amount, active: true },
      });
    } else {
      await prisma.servicePrice.create({ data: { id: uuidv7(), ...data } });
    }
  }
}

/** Барбери локації: user (idConflict-гейт) + staffAssignment + розклад. */
export async function seedLocationBarbers(location: { id: string }, barbers: BarberSeed[]) {
  for (const b of barbers) {
    await idConflict('user', { phone: b.phone }, b.id);
    const user = await prisma.user.upsert({
      where: { phone: b.phone },
      create: {
        // FIXED_IDS-режим — детермінований id, поза ним — свіжий UUID v7.
        id: b.id ?? uuidv7(),
        phone: b.phone,
        name: b.name,
        role: 'barber',
        active: true,
        selfSchedule: false,
      },
      update: { name: b.name, role: 'barber', active: true },
    });
    await seedAssignment(location, user);
  }
}

/** Призначення в локацію + щоденні availabilityWindow (Пн–Сб 09:00–17:00). */
async function seedAssignment(location: { id: string }, user: { id: string }) {
  await prisma.staffAssignment.upsert({
    where: { barberId_locationId: { barberId: user.id, locationId: location.id } },
    create: { id: uuidv7(), barberId: user.id, locationId: location.id },
    update: {},
  });
  for (const w of BARBER_WEEK) {
    await prisma.availabilityWindow.upsert({
      where: {
        barberId_locationId_dayOfWeek_start_end: {
          barberId: user.id,
          locationId: location.id,
          dayOfWeek: w.dayOfWeek,
          start: w.start,
          end: w.end,
        },
      },
      create: {
        id: uuidv7(),
        barberId: user.id,
        locationId: location.id,
        dayOfWeek: w.dayOfWeek,
        start: w.start,
        end: w.end,
      },
      update: {},
    });
  }
}
