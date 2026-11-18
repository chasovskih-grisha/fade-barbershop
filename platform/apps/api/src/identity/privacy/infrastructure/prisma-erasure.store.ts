// Prisma-сховище стирання (T-4805): заявки, вибірка прострочених, фіксація
// результату. Сама анонімізація PII — erasure.anonymize.ts.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import type { ErasureReport, ErasureStatus } from '../domain/erasure-policy';
import type {
  AnonymizationResult,
  ErasureRecord,
  ErasureStore,
  ErasureSubject,
} from '../application/erasure.ports';
import { anonymizeSubject } from './erasure.anonymize';

@Injectable()
export class PrismaErasureStore implements ErasureStore {
  constructor(private readonly prisma: PrismaService) {}

  async findSubjectByPhone(phone: string): Promise<ErasureSubject | null> {
    const user = await this.prisma.user.findUnique({ where: { phone }, select: { id: true } });
    return user ? { userId: user.id } : null;
  }

  async request(subjectId: string, phoneHash: string, now: Date): Promise<ErasureRecord> {
    const row = await this.prisma.accountErasure.upsert({
      where: { subjectId },
      create: { id: uuidv7(), subjectId, phoneHash, requestedAt: now, nextAttemptAt: now },
      update: { status: 'pending', nextAttemptAt: now, completedAt: null, lastError: null },
    });
    return this.map(row);
  }

  async due(now: Date, limit: number): Promise<ErasureRecord[]> {
    const rows = await this.prisma.accountErasure.findMany({
      where: { status: 'pending', nextAttemptAt: { lte: now } },
      orderBy: { nextAttemptAt: 'asc' },
      take: limit,
    });
    return rows.map((row) => this.map(row));
  }

  async markAttempt(id: string): Promise<void> {
    await this.prisma.accountErasure.update({
      where: { id },
      data: { status: 'processing', attempts: { increment: 1 } },
    });
  }

  async anonymize(input: {
    subject: ErasureSubject;
    replacementPhone: string;
    replacementEmail: string;
    now: Date;
  }): Promise<AnonymizationResult> {
    return anonymizeSubject(this.prisma, input);
  }

  async complete(id: string, report: ErasureReport, now: Date): Promise<void> {
    await this.prisma.accountErasure.update({
      where: { id },
      data: { status: 'completed', completedAt: now, report: { ...report }, lastError: null },
    });
  }

  async fail(id: string, error: string, nextAttemptAt: Date | null): Promise<void> {
    await this.prisma.accountErasure.update({
      where: { id },
      data: {
        status: nextAttemptAt ? 'pending' : 'failed',
        lastError: error.slice(0, 500),
        ...(nextAttemptAt ? { nextAttemptAt } : {}),
      },
    });
  }

  private map(row: {
    id: string;
    subjectId: string;
    status: string;
    attempts: number;
  }): ErasureRecord {
    return {
      id: row.id,
      subject: { userId: row.subjectId },
      status: row.status as ErasureStatus,
      attempts: row.attempts,
    };
  }
}
