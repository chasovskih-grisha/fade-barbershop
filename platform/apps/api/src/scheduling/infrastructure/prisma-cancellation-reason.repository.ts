// T-4560: durable-адаптер журналу причин скасувань/no-show.
// Рядки append-only: admin-«excused» додає нову фіксацію, тож попередній
// запис лишається в аудиті, а статистика бере останню фіксацію на візит.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { NoShowReason, ReasonedEvent } from '../domain/cancellation-reasons';
import type { CancellationReasonRepository } from '../application/no-show-management.service';

@Injectable()
export class PrismaCancellationReasonRepository implements CancellationReasonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(event: ReasonedEvent): Promise<void> {
    await this.prisma.cancellationReasonJournal.create({
      data: {
        id: uuidv7(),
        appointmentId: event.appointmentId,
        clientId: event.clientId,
        barberId: event.barberId,
        serviceId: event.serviceId,
        locationId: event.locationId,
        channel: event.channel,
        kind: event.kind,
        reason: event.reason,
        customReason: event.custom ?? null,
        noShowReason: event.noShowReason ?? null,
        excused: event.excused,
        cancelledBy: event.cancelledBy,
        startedAt: event.start,
        recordedAt: event.recordedAt,
      },
    });
  }

  async list(): Promise<ReasonedEvent[]> {
    const rows = await this.prisma.cancellationReasonJournal.findMany({
      orderBy: [{ recordedAt: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: {
    appointmentId: string;
    clientId: string;
    barberId: string;
    serviceId: string | null;
    locationId: string;
    channel: string;
    kind: string;
    reason: string | null;
    customReason: string | null;
    noShowReason: string | null;
    excused: boolean;
    cancelledBy: string;
    startedAt: Date;
    recordedAt: Date;
  }): ReasonedEvent {
    const noShowReason = row.noShowReason as NoShowReason | null;
    return {
      appointmentId: row.appointmentId,
      clientId: row.clientId,
      barberId: row.barberId,
      serviceId: row.serviceId,
      locationId: row.locationId,
      channel: row.channel as ReasonedEvent['channel'],
      kind: row.kind as ReasonedEvent['kind'],
      cancelledBy: row.cancelledBy as ReasonedEvent['cancelledBy'],
      reason: row.reason as ReasonedEvent['reason'],
      ...(row.customReason ? { custom: row.customReason } : {}),
      ...(noShowReason ? { noShowReason } : {}),
      excused: row.excused,
      start: row.startedAt,
      recordedAt: row.recordedAt,
    };
  }
}
