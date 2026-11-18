// Prisma-сховище idempotency-ключів (T-4207). key — унікальний; upsert, бо
// прострочений ключ перезаписується новою відповіддю (свіжий запит).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { uuidv7 } from '@fade/domain-shared';
import type { IdempotencySnapshot } from './idempotency';
import type { IdempotencyStore } from './idempotency.store';

@Injectable()
export class PrismaIdempotencyStore implements IdempotencyStore {
  constructor(private readonly prisma: PrismaService) {}

  async find(key: string): Promise<IdempotencySnapshot | null> {
    const row = await this.prisma.idempotencyRecord.findUnique({ where: { key } });
    if (!row) return null;
    return {
      key: row.key,
      fingerprint: row.fingerprint,
      statusCode: row.statusCode,
      body: row.responseBody,
      expiresAt: row.expiresAt,
    };
  }

  async save(snapshot: IdempotencySnapshot): Promise<void> {
    const data = {
      fingerprint: snapshot.fingerprint,
      statusCode: snapshot.statusCode,
      responseBody: snapshot.body as object,
      expiresAt: snapshot.expiresAt,
    };
    await this.prisma.idempotencyRecord.upsert({
      where: { key: snapshot.key },
      create: { id: uuidv7(), key: snapshot.key, ...data },
      update: data,
    });
  }

  async purgeExpired(now: Date): Promise<number> {
    const result = await this.prisma.idempotencyRecord.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    return result.count;
  }
}
