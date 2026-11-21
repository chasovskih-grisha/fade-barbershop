import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { NoShowStagedRecord } from '../domain/no-show-stage.policy';
import type { NoShowStagedRepository } from '../application/no-show-staged-response.service';

@Injectable()
export class PrismaNoShowStagedRepository implements NoShowStagedRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(row: any): NoShowStagedRecord {
    return {
      id: row.id,
      clientId: row.clientId,
      appointmentId: row.appointmentId,
      stage: row.stage as 'detected' | 'notified' | 'rebook_offered' | 'deposit_settled',
      depositAmount: row.depositAmount,
      ...(row.depositDecision == null
        ? {}
        : { depositDecision: row.depositDecision as 'retained' | 'refunded' | 'none' }),
      journal:
        row.journal?.map((j: any) => ({
          at: j.at?.toDate() ?? new Date(),
          action: j.action,
          actor: j.actor,
          amount: j.amount,
          note: j.note,
        })) ?? [],
      detectedAt: row.detectedAt?.toDate() ?? new Date(),
      createdAt: row.createdAt?.toDate() ?? new Date(),
      updatedAt: row.updatedAt?.toDate() ?? new Date(),
    };
  }

  async findById(id: string): Promise<NoShowStagedRecord | null> {
    const row = await this.prisma.noShowStaged.findUnique({ where: { id } });
    if (!row) return null;
    return this.mapRow(row);
  }

  async save(record: NoShowStagedRecord): Promise<void> {
    await this.prisma.noShowStaged.upsert({
      where: { id: record.id },
      update: {
        clientId: record.clientId,
        appointmentId: record.appointmentId,
        stage: record.stage,
        depositAmount: record.depositAmount,
        depositDecision: record.depositDecision ?? 'none',
        journal: record.journal as unknown as Prisma.InputJsonValue,
        detectedAt: record.detectedAt,
        updatedAt: new Date(),
      },
      create: {
        id: record.id,
        clientId: record.clientId,
        appointmentId: record.appointmentId,
        stage: record.stage,
        depositAmount: record.depositAmount,
        depositDecision: record.depositDecision ?? 'none',
        journal: record.journal as unknown as Prisma.InputJsonValue,
        detectedAt: record.detectedAt,
        createdAt: record.createdAt ?? new Date(),
        updatedAt: record.updatedAt ?? new Date(),
      },
    });
  }

  async list(): Promise<NoShowStagedRecord[]> {
    const rows = await this.prisma.noShowStaged.findMany({});
    return rows.map((row: any) => this.mapRow(row));
  }
}
