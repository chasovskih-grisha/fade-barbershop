import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { ServicePriceData } from '../domain/ports';

@Injectable()
export class PrismaCatalogAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async savePriceChange(price: ServicePriceData, actorId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const before = await tx.servicePrice.findUnique({
        where: {
          serviceId_locationId: { serviceId: price.serviceId, locationId: price.locationId },
        },
      });
      await tx.servicePrice.upsert({
        where: {
          serviceId_locationId: { serviceId: price.serviceId, locationId: price.locationId },
        },
        create: {
          id: uuidv7(),
          serviceId: price.serviceId,
          locationId: price.locationId,
          amount: price.amount,
          active: price.active,
        },
        update: { amount: price.amount, active: price.active },
      });
      await tx.catalogAudit.create({
        data: {
          id: uuidv7(),
          actorId,
          objectType: 'service-price',
          objectId: `${price.serviceId}:${price.locationId}`,
          before: before ? { amount: before.amount, active: before.active } : Prisma.JsonNull,
          after: { amount: price.amount, active: price.active },
        },
      });
    });
  }

  async record(input: {
    actorId: string;
    objectType: 'service' | 'service-price';
    objectId: string;
    before: unknown;
    after: unknown;
  }): Promise<void> {
    await this.prisma.catalogAudit.create({
      data: {
        id: uuidv7(),
        actorId: input.actorId,
        objectType: input.objectType,
        objectId: input.objectId,
        before:
          input.before === null
            ? Prisma.JsonNull
            : PrismaCatalogAuditRepository.toJson(input.before),
        after: PrismaCatalogAuditRepository.toJson(input.after),
      },
    });
  }

  private static toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
