// Prisma-адаптер репозиторію SourcePhoto. Методи працюють з активним tx-клієнтом
// (currentDb) у транзакції PrismaUnitOfWork, інакше — з базовим (identity README).

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { SourcePhoto, type SourcePhotoProps } from '../domain/source-photo';
import type { SourcePhotoRepository } from '../domain/ports';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';

interface SourcePhotoRow {
  id: string;
  ownerId: string;
  objectKey: string;
  bucket: string;
  contentType: string;
  sizeBytes: number;
  consentGranted: boolean;
  consentGrantedAt: Date | null;
  consentRevokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class PrismaSourcePhotoRepository implements SourcePhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async findById(id: string): Promise<SourcePhoto | null> {
    const row = await this.db().sourcePhoto.findUnique({ where: { id } });
    return row ? mapPhoto(row) : null;
  }

  async findByOwnerId(ownerId: string): Promise<SourcePhoto[]> {
    const rows = await this.db().sourcePhoto.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapPhoto);
  }

  async findByIds(ids: readonly string[]): Promise<SourcePhoto[]> {
    if (ids.length === 0) return [];
    const rows = await this.db().sourcePhoto.findMany({
      where: { id: { in: [...ids] }, deletedAt: null },
    });
    return rows.map(mapPhoto);
  }

  async save(photo: SourcePhoto): Promise<void> {
    const p = photo.propsData;
    const data = {
      ownerId: p.ownerId,
      objectKey: p.objectKey,
      bucket: p.bucket,
      contentType: p.contentType,
      sizeBytes: p.sizeBytes,
      consentGranted: p.consentGranted,
      consentGrantedAt: p.consentGrantedAt,
      consentRevokedAt: p.consentRevokedAt,
      deletedAt: p.deletedAt,
    };
    await this.db().sourcePhoto.upsert({
      where: { id: p.id },
      create: { id: p.id, ...data },
      update: data,
    });
  }

  /** Каскад (Prisma onDelete: Cascade) прибирає й HaircutSuggestion цього фото. */
  async remove(id: string): Promise<void> {
    await this.db().sourcePhoto.deleteMany({ where: { id } });
  }
}

function mapPhoto(row: SourcePhotoRow): SourcePhoto {
  return SourcePhoto.reconstitute(toProps(row));
}

/** Рядок БД → props агрегату (null-и, а не undefined: exactOptionalPropertyTypes). */
export function toProps(row: SourcePhotoRow): SourcePhotoProps {
  return {
    id: row.id,
    ownerId: row.ownerId,
    objectKey: row.objectKey,
    bucket: row.bucket,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    consentGranted: row.consentGranted,
    consentGrantedAt: row.consentGrantedAt,
    consentRevokedAt: row.consentRevokedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}
