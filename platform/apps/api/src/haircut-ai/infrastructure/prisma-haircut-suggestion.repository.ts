// Prisma-адаптер репозиторію HaircutSuggestion. Мапінг рядка БД → агрегат
// (валідація JSONB-варіантів) у suggestion-row-mapper.ts.

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { HaircutSuggestion, type SuggestionStatus } from '../domain/haircut-suggestion';
import type { HaircutSuggestionRepository } from '../domain/ports';
import { mapSuggestion } from './suggestion-row-mapper';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class PrismaHaircutSuggestionRepository implements HaircutSuggestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async findById(id: string): Promise<HaircutSuggestion | null> {
    const row = await this.db().haircutSuggestion.findUnique({ where: { id } });
    return row ? HaircutSuggestion.reconstitute(mapSuggestion(row)) : null;
  }

  async findBySourcePhotoId(sourcePhotoId: string): Promise<HaircutSuggestion[]> {
    const rows = await this.db().haircutSuggestion.findMany({
      where: { sourcePhotoId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => HaircutSuggestion.reconstitute(mapSuggestion(row)));
  }

  async findByOwnerId(ownerId: string): Promise<HaircutSuggestion[]> {
    const rows = await this.db().haircutSuggestion.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => HaircutSuggestion.reconstitute(mapSuggestion(row)));
  }

  /** Черга воркера: FIFO за createdAt — старіші pending обробляються першими. */
  async findByStatuses(statuses: readonly SuggestionStatus[]): Promise<HaircutSuggestion[]> {
    const rows = await this.db().haircutSuggestion.findMany({
      where: { status: { in: [...statuses] } },
      orderBy: { createdAt: 'asc' },
      take: 25,
    });
    return rows.map((row) => HaircutSuggestion.reconstitute(mapSuggestion(row)));
  }

  async save(suggestion: HaircutSuggestion): Promise<void> {
    const p = suggestion.propsData;
    const data = {
      sourcePhotoId: p.sourcePhotoId,
      ownerId: p.ownerId,
      status: p.status,
      variantCount: p.variantCount,
      variants: p.variants as unknown as Prisma.InputJsonValue,
      failureReason: p.failureReason,
      errorMessage: p.errorMessage,
      providerJobHandle: p.providerJobHandle,
      completedAt: p.completedAt,
      failedAt: p.failedAt,
    };
    await this.db().haircutSuggestion.upsert({
      where: { id: p.id },
      create: { id: p.id, ...data },
      update: data,
    });
  }
}
