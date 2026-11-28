import type { PrismaService } from '../../shared/prisma/prisma.service';
import type { ServicePriceData } from '../domain/ports';
import { toPriceData } from './service-row';
import type { DurationVariant } from '../domain/duration-variant';

export async function listPricesForService(
  prisma: PrismaService,
  serviceId: string
): Promise<ServicePriceData[]> {
  const rows = await prisma.servicePrice.findMany({
    where: { serviceId },
    orderBy: { locationId: 'asc' },
  });
  return rows.map(toPriceData);
}

export async function listActivePricesByLocation(
  prisma: PrismaService,
  locationId: string
): Promise<ServicePriceData[]> {
  const rows = await prisma.servicePrice.findMany({
    where: { locationId, active: true, service: { active: true } },
    include: { service: true },
    orderBy: [{ service: { sortOrder: 'asc' } }, { service: { name: 'asc' } }],
  });
  return rows.map(toPriceData);
}

export async function catalogForLocation(
  prisma: PrismaService,
  locationId: string
): Promise<
  Array<{
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    duration: number;
    parallelDuration: number | null;
    price: number;
    variants: DurationVariant[] | null;
  }>
> {
  const rows = await prisma.servicePrice.findMany({
    where: { locationId, active: true, service: { active: true } },
    include: { service: true },
    orderBy: [{ service: { sortOrder: 'asc' } }, { service: { name: 'asc' } }],
  });
  return rows.map((row) => ({
    id: row.service.id,
    name: row.service.name,
    description: row.service.description,
    category: row.service.category,
    duration: row.service.duration,
    parallelDuration: row.service.parallelDuration,
    price: row.amount,
    variants: (row.service.durationVariants as DurationVariant[] | null) ?? null,
  }));
}
