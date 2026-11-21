/** Prisma-адаптер для `SavedClientFilterRepository` (T-4461).
 * Реалізує порт домену, використовуючи згенерованого клієнта Prisma.
 * У `prisma/schema.prisma` додана модель `SavedClientFilter`.
 */

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client'; // згенерований Prisma Client

import { PrismaService } from '../../shared/prisma/prisma.service';
import { SavedClientFilter } from '../domain/saved-client-filter';
import type { SavedClientFilterRepository } from '../application/saved-client-filter.service';

@Injectable()
export class PrismaSavedClientFilterRepository implements SavedClientFilterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SavedClientFilter | null> {
    const record = await this.prisma.savedClientFilter.findUnique({
      where: { id },
    });
    if (!record) return null;
    return {
      id: record.id,
      ownerId: record.ownerId,
      name: record.name,
      query: record.query as any,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async listByOwner(ownerId: string): Promise<SavedClientFilter[]> {
    const records = await this.prisma.savedClientFilter.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
    });
    return records.map(
      (record: {
        id: string;
        ownerId: string;
        name: string;
        query: unknown;
        createdAt: Date;
        updatedAt: Date;
      }) => ({
        id: record.id,
        ownerId: record.ownerId,
        name: record.name,
        query: record.query as any,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );
  }

  async save(filter: SavedClientFilter): Promise<void> {
    await this.prisma.savedClientFilter.upsert({
      where: { id: filter.id },
      update: {
        ownerId: filter.ownerId,
        name: filter.name,
        query: filter.query as unknown as Prisma.InputJsonValue,
        updatedAt: filter.updatedAt,
      },
      create: {
        id: filter.id,
        ownerId: filter.ownerId,
        name: filter.name,
        query: filter.query as unknown as Prisma.InputJsonValue,
        createdAt: filter.createdAt,
        updatedAt: filter.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.savedClientFilter.delete({
      where: { id },
    });
  }
}
