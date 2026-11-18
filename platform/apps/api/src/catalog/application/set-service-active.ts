import type { ServiceRepository } from '../domain/ports';
import { ServiceNotFoundError } from './services-errors';

export class SetServiceActiveHandler {
  constructor(private readonly services: ServiceRepository) {}

  async handle(id: string, active: boolean): Promise<{ id: string }> {
    const service = await this.services.findById(id);
    if (!service) throw new ServiceNotFoundError();
    service.setActive(active);
    await this.services.save(service);
    return { id: service.id };
  }
}
