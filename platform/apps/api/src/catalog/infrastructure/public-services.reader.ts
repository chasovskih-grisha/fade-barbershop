import { Injectable } from '@nestjs/common';
import { PrismaServiceRepository } from './prisma-service.repository';
import type { ServiceProps } from '../domain/service';

@Injectable()
export class ServicesReader {
  constructor(private readonly repo: PrismaServiceRepository) {}

  listActiveWith(): Promise<ServiceProps[]> {
    return this.repo.listActive().then((services) => services.map((s) => s.propsData));
  }

  listForLocation(locationId: string) {
    return this.repo.catalogForLocation(locationId);
  }

  findById(id: string): Promise<ServiceProps | null> {
    return this.repo.findById(id).then((s) => (s ? s.propsData : null));
  }
}
