/* eslint-disable max-lines -- T-4458: row mapping and conditional claim in one adapter. */
// T-4458: Prisma-сховище заявок на зміну часу. `claimConfirmation` — умовний
// update за status=approved і agreementEventId=null: рівно один паралельний
// запит виграє право записати подію та перенести візит.
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type {
  ClientAgreement,
  Proposal,
  Rejection,
  ScheduleChangeRequest,
  ScheduleChangeStatus,
  SlotRef,
} from '../domain/schedule-change-request';
import { effectiveStatus } from '../domain/schedule-change-request';
import type { ScheduleChangeRepository } from '../application/schedule-change-approval.service';

type Row = {
  id: string;
  appointmentId: string;
  clientId: string;
  currentSlot: Prisma.JsonValue;
  requestedSlot: Prisma.JsonValue | null;
  status: string;
  requestedAt: Date;
  proposal: Prisma.JsonValue | null;
  rejection: Prisma.JsonValue | null;
  agreement: Prisma.JsonValue | null;
  agreementEventId: string | null;
};

@Injectable()
export class PrismaScheduleChangeRepository implements ScheduleChangeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async findById(id: string): Promise<ScheduleChangeRequest | null> {
    const row = await this.db().scheduleChangeRequest.findUnique({ where: { id } });
    return row ? toRequest(row) : null;
  }

  async save(request: ScheduleChangeRequest): Promise<void> {
    const data = {
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      currentSlot: request.currentSlot as unknown as Prisma.InputJsonValue,
      requestedSlot: jsonOrNull(request.requestedSlot),
      status: request.status,
      requestedAt: request.requestedAt,
      proposal: jsonOrNull(request.proposal),
      rejection: jsonOrNull(request.rejection),
      agreement: jsonOrNull(request.agreement),
      agreementEventId: request.agreement?.eventId ?? null,
    };
    await this.db().scheduleChangeRequest.upsert({
      where: { id: request.id },
      create: { id: request.id, ...data },
      update: data,
    });
  }

  async claimConfirmation(request: ScheduleChangeRequest): Promise<boolean> {
    if (!request.agreement) return false;
    const result = await this.db().scheduleChangeRequest.updateMany({
      where: { id: request.id, status: 'approved', agreementEventId: null },
      data: {
        status: 'confirmed',
        agreement: request.agreement as unknown as Prisma.InputJsonValue,
        agreementEventId: request.agreement.eventId,
      },
    });
    return result.count === 1;
  }

  async list(): Promise<ScheduleChangeRequest[]> {
    const rows = await this.db().scheduleChangeRequest.findMany({
      orderBy: { requestedAt: 'desc' },
    });
    return rows.map(toRequest);
  }

  /** Для списків із фільтром: ефективний стан рахує сервіс, не БД. */
  async listByEffectiveStatus(
    status: ScheduleChangeStatus,
    now: Date
  ): Promise<ScheduleChangeRequest[]> {
    const rows = await this.list();
    return rows.filter((row) => effectiveStatus(row, now) === status);
  }
}

function jsonOrNull(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === undefined || value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

function toRequest(row: Row): ScheduleChangeRequest {
  const request: ScheduleChangeRequest = {
    id: row.id,
    appointmentId: row.appointmentId,
    clientId: row.clientId,
    currentSlot: row.currentSlot as unknown as SlotRef,
    status: row.status as ScheduleChangeStatus,
    requestedAt: row.requestedAt,
  };
  if (row.requestedSlot) request.requestedSlot = row.requestedSlot as unknown as SlotRef;
  if (row.proposal) request.proposal = row.proposal as unknown as Proposal;
  if (row.rejection) request.rejection = row.rejection as unknown as Rejection;
  if (row.agreement) request.agreement = row.agreement as unknown as ClientAgreement;
  return request;
}
