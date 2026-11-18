import type { ServiceRepository } from '../domain/ports';
import type { Service } from '../domain/service';

export class ListServicesHandler {
  constructor(private readonly services: ServiceRepository) {}

  list(): Promise<Service[]> {
    return this.services.list();
  }
  listActive(): Promise<Service[]> {
    return this.services.listActive();
  }

  async findById(id: string): Promise<Service> {
    const service = await this.services.findById(id);
    if (!service) throw new Error('ServiceNotFound');
    return service;
  }
}
