import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { Service } from '../domain/service';
import type { ServiceProps } from '../domain/service';
import type { ServicePriceData, ServicePriceRepository, ServiceRepository } from '../domain/ports';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { serviceUpsertData, toPriceData, toService } from './service-row';
import { catalogForLocation, listActivePricesByLocation, listPricesForService } from './service-price-queries';

@Injectable()
export class PrismaServiceRepository implements ServiceRepository, ServicePriceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Service | null> {
    const row = await this.prisma.service.findUnique({ where: { id } });
    return row ? toService(row) : null;
  }

  async findByName(name: string, duration: number): Promise<Service | null> {
    const row = await this.prisma.service.findUnique({
      where: { name_duration: { name, duration } },
    });
    return row ? toService(row) : null;
  }

  async save(service: Service): Promise<void> {
    const p: ServiceProps = service.propsData;
    await this.prisma.service.upsert({
      where: { id: p.id },
      create: { id: p.id, ...serviceUpsertData(p) },
      update: serviceUpsertData(p),
    });
  }

  async list(): Promise<Service[]> {
    const rows = await this.prisma.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toService);
  }

  async listActive(): Promise<Service[]> {
    const rows = await this.prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toService);
  }

  async find(serviceId: string, locationId: string): Promise<ServicePriceData | null> {
    const row = await this.prisma.servicePrice.findUnique({
      where: { serviceId_locationId: { serviceId, locationId } },
    });
    return row ? toPriceData(row) : null;
  }

  async savePrice(price: ServicePriceData): Promise<void> {
    await this.prisma.servicePrice.upsert({
      where: { serviceId_locationId: { serviceId: price.serviceId, locationId: price.locationId } },
      create: {
        id: uuidv7(),
        serviceId: price.serviceId,
        locationId: price.locationId,
        amount: price.amount,
        active: price.active,
      },
      update: { amount: price.amount, active: price.active },
    });
  }

  listForService(serviceId: string): Promise<ServicePriceData[]> {
    return listPricesForService(this.prisma, serviceId);
  }

  listActiveByLocation(locationId: string): Promise<ServicePriceData[]> {
    return listActivePricesByLocation(this.prisma, locationId);
  }

  catalogForLocation(locationId: string) {
    return catalogForLocation(this.prisma, locationId);
  }
}
