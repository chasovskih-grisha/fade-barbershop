function weekDays() {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day,
    open: '09:00',
    close: '20:00',
    closed: false,
  }));
}

export function locationPayload(code: string) {
  return {
    code,
    name: 'Fade Baumana',
    address: 'вул. Богдана Хмельницького, 23',
    lat: 50.4501,
    lng: 30.5234,
    hours: weekDays(),
  };
}

export class InMemoryLocationRepo {
  store = new Map<string, any>();
  async findById(id: string) {
    return this.store.get(id) ?? null;
  }
  async findByCode(code: string) {
    return [...this.store.values()].find((l) => l.code === code) ?? null;
  }
  async save(location: any) {
    this.store.set(location.id, location);
  }
  async list() {
    return [...this.store.values()];
  }
  async listActive() {
    return [...this.store.values()].filter((l) => l.active);
  }
}
