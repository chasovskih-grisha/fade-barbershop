// Prisma-адаптер LocationLogoRepository (T-4609a): один рядок на локацію,
// upsert по locationId, listByLocationIds — один запит для публічного списку.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { LocationLogo } from '../domain/location-logo';
import type { LocationLogoRepository } from '../domain/ports';

type LogoRow = {
  locationId: string;
  variant: string;
  lightKey: string;
  darkKey: string | null;
  alt: string;
  updatedAt: Date;
};

const toDomain = (row: LogoRow): LocationLogo => ({
  locationId: row.locationId,
  variant: row.variant as LocationLogo['variant'],
  lightKey: row.lightKey,
  darkKey: row.darkKey,
  alt: row.alt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class PrismaLocationLogoRepository implements LocationLogoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByLocationId(locationId: string): Promise<LocationLogo | null> {
    const row = await this.prisma.locationLogo.findUnique({ where: { locationId } });
    return row ? toDomain(row) : null;
  }

  async listByLocationIds(locationIds: string[]): Promise<LocationLogo[]> {
    if (locationIds.length === 0) return [];
    const rows = await this.prisma.locationLogo.findMany({
      where: { locationId: { in: locationIds } },
    });
    return rows.map(toDomain);
  }

  async save(logo: LocationLogo): Promise<void> {
    const data = {
      variant: logo.variant,
      lightKey: logo.lightKey,
      darkKey: logo.darkKey,
      alt: logo.alt,
    };
    await this.prisma.locationLogo.upsert({
      where: { locationId: logo.locationId },
      create: { id: uuidv7(), locationId: logo.locationId, ...data },
      update: data,
    });
  }

  async delete(locationId: string): Promise<void> {
    await this.prisma.locationLogo.deleteMany({ where: { locationId } });
  }
}
