import { Prisma, type Service as ServiceRow } from '@prisma/client';
import { Service } from '../domain/service';
import type { ServiceProps } from '../domain/service';
import type { DurationVariant } from '../domain/duration-variant';
import type { ServicePriceData } from '../domain/ports';

/** Поля Service для update/create в upsert (ідентичний набір, окрім id). */
export function serviceUpsertData(p: ServiceProps) {
  return {
    name: p.name,
    duration: p.duration,
    parallelDuration: p.parallelDuration,
    description: p.description,
    category: p.category,
    slug: p.slug,
    seoDescription: p.seoDescription,
    faq: p.faq,
    durationVariants: (p.variants ?? Prisma.DbNull) as unknown as Prisma.InputJsonValue,
    active: p.active,
    sortOrder: p.sortOrder,
  };
}

export function toService(row: ServiceRow): Service {
  return Service.restore({
    id: row.id,
    name: row.name,
    duration: row.duration,
    parallelDuration: row.parallelDuration,
    description: row.description,
    category: row.category,
    slug: row.slug,
    seoDescription: row.seoDescription,
    faq: row.faq,
    variants: (row.durationVariants as DurationVariant[] | null) ?? null,
    active: row.active,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toPriceData(row: {
  id: string;
  serviceId: string;
  locationId: string;
  amount: number;
  active: boolean;
  updatedAt: Date;
}): ServicePriceData {
  return {
    id: row.id,
    serviceId: row.serviceId,
    locationId: row.locationId,
    amount: row.amount,
    active: row.active,
    updatedAt: row.updatedAt,
  };
}
