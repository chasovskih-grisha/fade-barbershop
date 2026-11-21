import { uuidv7 } from '@fade/domain-shared';
import { idConflict, prisma } from './db';
import { WEEK_MON_SAT_OPEN } from './data-locations';

// Елементи довідників: typeof import(...) — тип із модуля без runtime-імпорту.
// Попередня форма `Parameters<...SERVICES...>[number]` зводила тип до never
// (Parameters потребує функцію, а SERVICES — масив) і ламала компіляцію сіду.
type ServiceSeed = (typeof import('./data-catalog'))['SERVICES'][number];
type LocationSeed = (typeof import('./data-locations'))['LOCATIONS'][number];

/** Послуга сіда: довідник + необовʼязковий флаг аддона (isAddon) для унікального ключа. */
type SeedService = ServiceSeed & { isAddon?: boolean };

/** Послуга після upsert: довідник + id рядка в БД (для цін і підсумку). */
type SeededService = SeedService & { service: { id: string } };

/** Послуги: idConflict-гейт + upsert за [name, duration, isAddon], sortOrder = порядок. */
export async function seedServices(services: SeedService[]) {
  // Анотація розриває цикл виведення: evolves-масив залежить від `service`,
  // а `service` — від seeded.length у create (TS7022 «в самій ініціалізації»).
  const seeded: SeededService[] = [];
  for (const s of services) {
    await idConflict(
      'service',
      {
        name_duration_isAddon: { name: s.name, duration: s.duration, isAddon: s.isAddon ?? false },
      },
      s.id
    );
    const service = await prisma.service.upsert({
      where: {
        name_duration_isAddon: { name: s.name, duration: s.duration, isAddon: s.isAddon ?? false },
      },
      create: {
        // FIXED_IDS-режим — детермінований id, поза ним — свіжий UUID v7.
        id: s.id ?? uuidv7(),
        name: s.name,
        duration: s.duration,
        parallelDuration: s.parallelDuration,
        description: s.description,
        category: s.category,
        sortOrder: seeded.length,
        isAddon: s.isAddon ?? false,
      },
      update: {
        parallelDuration: s.parallelDuration,
        description: s.description,
        category: s.category,
      },
    });
    seeded.push({ ...s, service });
  }
  return seeded;
}

/** Агрегат локації: upsert ядра + перестворення залежних рядків. */
export async function seedLocation(loc: LocationSeed) {
  const location = await prisma.location.upsert({
    where: { code: loc.code },
    create: {
      id: loc.id ?? uuidv7(),
      code: loc.code,
      name: loc.name,
      address: loc.address,
      street: loc.addressParts?.street ?? null,
      building: loc.addressParts?.building ?? null,
      city: loc.addressParts?.city ?? null,
      country: loc.addressParts?.country ?? null,
      lat: loc.lat,
      lng: loc.lng,
      phone: loc.phone,
      email: loc.email,
      active: true,
    },
    update: {
      name: loc.name,
      address: loc.address,
      street: loc.addressParts?.street ?? null,
      building: loc.addressParts?.building ?? null,
      city: loc.addressParts?.city ?? null,
      country: loc.addressParts?.country ?? null,
      lat: loc.lat,
      lng: loc.lng,
      phone: loc.phone,
      email: loc.email,
      active: true,
    },
  });
  await replaceLocationChildren(loc, location.id);
  return location;
}

/** Залежні рядки належать агрегату локації — видаляємо-перестворюємо. */
async function replaceLocationChildren(loc: LocationSeed, locationId: string) {
  await prisma.openingHour.deleteMany({ where: { locationId } });
  await prisma.openingHour.createMany({
    data: WEEK_MON_SAT_OPEN.map((h) => ({ id: uuidv7(), ...h, locationId })),
  });

  // Інваріант мережі: рівно 2 крісла на локацію (number 1..2, chair.ts).
  await prisma.chair.deleteMany({ where: { locationId } });
  await prisma.chair.createMany({
    data: [1, 2].map((number) => ({
      id: uuidv7(),
      number,
      name: `Крісло ${number}`,
      locationId,
      active: true,
    })),
  });

  await prisma.locationChannel.deleteMany({ where: { locationId } });
  await prisma.locationChannel.createMany({
    data: loc.channels.map((c) => ({ id: uuidv7(), ...c, locationId })),
  });

  await prisma.locationPhoto.deleteMany({ where: { locationId } });
  await prisma.locationPhoto.createMany({
    data: loc.photos.map((p) => ({ id: uuidv7(), ...p, locationId })),
  });
}
