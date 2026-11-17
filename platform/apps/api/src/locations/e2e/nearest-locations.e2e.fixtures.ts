// Допоміжні фікстури e2e «найближчі локації».

import { Location } from '../domain/location';
import { OpeningHours, type DayHours } from '../domain/opening-hours';

const WEEK = Array.from({ length: 7 }, (_, dayOfWeek): DayHours =>
  dayOfWeek < 6
    ? { dayOfWeek, open: '09:00', close: '20:00', closed: false }
    : { dayOfWeek, open: null, close: null, closed: true }
);

function makeLocation(opts: {
  id: string;
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}): Location {
  const { id, code, name, address, lat, lng } = opts;
  return Location.reconstitute({
    id,
    code,
    name,
    address,
    addressParts: null,
    lat,
    lng,
    phone: null,
    email: null,
    active: true,
    chairs: [],
    channels: [],
    photos: [],
    hours: OpeningHours.of(WEEK),
    createdAt: new Date('2026-09-24T10:00:00.000Z'),
  });
}

export const PODIL = makeLocation({
  id: 'loc-podil',
  code: 'KYY-01',
  name: 'FADE Podil',
  address: 'вул. Верхній Вал 28, Київ',
  lat: 50.4649,
  lng: 30.5171,
});
export const OBOOLON = makeLocation({
  id: 'loc-obolon',
  code: 'KYY-02',
  name: 'FADE Obolon',
  address: 'Оболонський просп. 21, Київ',
  lat: 50.5008,
  lng: 30.5324,
});
export const LVIV = makeLocation({
  id: 'loc-lviv',
  code: 'LVI-01',
  name: 'FADE Lviv',
  address: 'вул. Городоцька 174, Львів',
  lat: 49.8397,
  lng: 24.0297,
});

export class InMemoryLocationRepository {
  store = new Map<string, Location>();
  async listActive(): Promise<Location[]> {
    return [...this.store.values()].filter((l) => l.active);
  }
  async findById(id: string): Promise<Location | null> {
    return this.store.get(id) ?? null;
  }
  async findByCode(code: string): Promise<Location | null> {
    return [...this.store.values()].find((l) => l.code === code) ?? null;
  }
  async save(location: Location): Promise<void> {
    void this.store.set(location.id, location);
  }
  async list(): Promise<Location[]> {
    return [...this.store.values()];
  }
}
