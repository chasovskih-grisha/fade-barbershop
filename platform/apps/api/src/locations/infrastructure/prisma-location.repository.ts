// Prisma-адаптер LocationRepository. Зберігає агрегат разом з кріслами та
// годинами (видаляє-перестворює залежні рядки — вони належать агрегату).

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import { Location } from '../domain/location';
import type { LocationRepository } from '../domain/ports';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { hydrateLocation, locationPersistPayload } from './location-row';

@Injectable()
export class PrismaLocationRepository implements LocationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  private async findOne(where: { id: string } | { code: string }): Promise<Location | null> {
    const row = await this.db().location.findUnique({
      where,
      include: { chairs: true, hours: true, channels: true, photos: true },
    });
    return row ? hydrateLocation(row) : null;
  }

  findById(id: string): Promise<Location | null> {
    return this.findOne({ id });
  }

  findByCode(code: string): Promise<Location | null> {
    return this.findOne({ code });
  }

  async save(location: Location): Promise<void> {
    const db = this.db();
    const data = locationPersistPayload(location);
    await db.location.upsert({
      where: { id: location.id },
      create: { id: location.id, code: location.code, ...data },
      update: data,
    });
    await db.chair.deleteMany({ where: { locationId: location.id } });
    await db.openingHour.deleteMany({ where: { locationId: location.id } });
    await db.locationChannel.deleteMany({ where: { locationId: location.id } });
    await db.locationPhoto.deleteMany({ where: { locationId: location.id } });
    await db.chair.createMany({
      data: [...location.chairs].map((c) => ({
        id: uuidv7(),
        locationId: location.id,
        number: c.number,
        name: c.name,
        active: c.active,
      })),
    });
    await db.openingHour.createMany({
      data: [...location.hours.days].map((d) => ({
        id: uuidv7(),
        locationId: location.id,
        dayOfWeek: d.dayOfWeek,
        open: d.open,
        close: d.close,
        closed: d.closed,
      })),
    });
    await db.locationChannel.createMany({
      data: [...location.channels].map((c) => ({
        id: uuidv7(),
        locationId: location.id,
        channel: c.channel,
        value: c.value,
        sortOrder: c.sortOrder,
      })),
    });
    await db.locationPhoto.createMany({
      data: [...location.photos].map((p) => ({
        id: uuidv7(),
        locationId: location.id,
        url: p.url,
        caption: p.caption,
        sortOrder: p.sortOrder,
      })),
    });
  }

  async list(): Promise<Location[]> {
    const rows = await this.db().location.findMany({
      include: { chairs: true, hours: true, channels: true, photos: true },
      orderBy: { code: 'asc' },
    });
    return rows.map((row) => hydrateLocation(row));
  }

  async listActive(): Promise<Location[]> {
    const rows = await this.db().location.findMany({
      where: { active: true },
      include: { chairs: true, hours: true, channels: true, photos: true },
      orderBy: { code: 'asc' },
    });
    return rows.map((row) => hydrateLocation(row));
  }
}
