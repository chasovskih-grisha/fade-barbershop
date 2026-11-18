// Тест-хелпери context locations для функціональних тестів use cases і
// домену. Підпадає під *.fakes.ts — поза coverage (jest.config.js).

import { CreateLocationHandler } from './application/create-location';
import { FakeClock, FakeLocationRepository, FakeOutbox, SeqIds, passthroughUow } from './application/ports.fakes';
import { Coordinates } from './domain/coordinates';
import { Location } from './domain/location';
import { OpeningHours } from './domain/opening-hours';

export const T0 = '2026-09-21T10:00:00.000Z';

export function weekDays(
  overrides: Record<number, { open: string; close: string } | 'closed'> = {}
) {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => {
    const value = overrides[day];
    if (value === 'closed') return { dayOfWeek: day, open: null, close: null, closed: true };
    if (value) return { dayOfWeek: day, open: value.open, close: value.close, closed: false };
    return { dayOfWeek: day, open: '09:00', close: '20:00', closed: false };
  });
}

export function baseInput(overrides = {}) {
  return {
    code: 'clt-01',
    name: 'Fade Baumana',
    address: 'вул. Богдана Хмельницького, 23',
    lat: 50.4501,
    lng: 30.5234,
    phone: null,
    email: null,
    hours: weekDays(),
    ...overrides,
  };
}

/** Синхронно будує готовий агрегат Location (без репо/продюсера) з
 * baseInput-полів. Придатний для `locations.save(createLocation(...))`
 * у тестах, де конструкємо свій FakeLocationRepository. */
export function createLocation(overrides = {}) {
  const input = baseInput(overrides);
  return Location.create({
    id: (overrides as { id?: string }).id ?? 'loc-1',
    code: input.code,
    name: input.name,
    address: input.address,
    coordinates: Coordinates.of(input.lat, input.lng),
    phone: input.phone ?? null,
    email: input.email ?? null,
    hours: OpeningHours.of(weekDays()),
    createdAt: new Date(T0),
  });
}

export async function seedLocation(overrides = {}) {
  const clock = new FakeClock(T0);
  const locations = new FakeLocationRepository();
  const outbox = new FakeOutbox();
  const ids = new SeqIds();
  const create = new CreateLocationHandler({
    locations,
    outbox,
    clock,
    ids,
    uow: passthroughUow,
  });
  await create.handle(baseInput(overrides));
  return { locations, outbox, clock, ids, create };
}
