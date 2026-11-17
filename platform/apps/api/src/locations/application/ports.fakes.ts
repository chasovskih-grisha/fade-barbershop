// Фейки портів context locations для функціональних тестів use cases
// (engineering-principles.md: «не мокати те, що має фейк порту»).

import type { DomainEvent } from '../domain/location.events';
import type { Location } from '../domain/location';
import type { Clock, IdGenerator, LocationRepository, Outbox, UnitOfWork } from '../domain/ports';

export class FakeClock implements Clock {
  private current: number;
  constructor(iso: string) {
    this.current = new Date(iso).getTime();
  }
  now(): Date {
    return new Date(this.current);
  }
  advance(ms: number): void {
    this.current += ms;
  }
}

export class SeqIds implements IdGenerator {
  private n = 0;
  id(): string {
    this.n += 1;
    return `loc-${this.n}`;
  }
}

export class FakeOutbox implements Outbox {
  readonly events: DomainEvent[] = [];
  async append(events: readonly DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

export type {
  Outbox,
  IdGenerator,
  Clock,
  UnitOfWork,
  LocationRepository,
  StaffAssignmentRepository,
} from '../../locations/domain/ports';

export class FakeLocationRepository implements LocationRepository {
  private store = new Map<string, Location>();
  async findById(id: string): Promise<Location | null> {
    return this.store.get(id) ?? null;
  }
  async findByCode(code: string): Promise<Location | null> {
    return [...this.store.values()].find((l) => l.code === code) ?? null;
  }
  async save(location: Location): Promise<void> {
    this.store.set(location.id, location);
  }
  async list(): Promise<Location[]> {
    return [...this.store.values()];
  }
  async listActive(): Promise<Location[]> {
    return [...this.store.values()].filter((l) => l.active);
  }
}

export const passthroughUow: UnitOfWork = {
  run: async <T>(work: () => Promise<T>): Promise<T> => work(),
};

export { FakeGeocoder, FakeStaffAssignmentRepository } from './ports.fakes.extra';
