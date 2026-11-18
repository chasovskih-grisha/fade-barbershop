import { Service } from '../domain/service';
import type { ServiceRepository } from '../domain/ports';

export class FakeServicesRepository implements ServiceRepository {
  private readonly store = new Map<string, Service>();

  async findById(id: string): Promise<Service | null> {
    return this.store.get(id) ?? null;
  }

  async findByName(name: string, duration: number): Promise<Service | null> {
    for (const s of this.store.values()) {
      if (s.name === name && s.duration === duration) return s;
    }
    return null;
  }

  async save(service: Service): Promise<void> {
    this.store.set(service.id, service);
  }

  async list(): Promise<Service[]> {
    return [...this.store.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
    );
  }

  async listActive(): Promise<Service[]> {
    return (await this.list()).filter((s) => s.active);
  }
}
