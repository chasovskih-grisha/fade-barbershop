// T-4619a: durable-адаптер утримань крісла під незаплачений депозит.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { DepositHold } from '../domain/deposit-hold';
import type { DepositHoldRepository } from '../application/deposit-hold.service';

type DepositHoldRow = {
  id: string;
  appointmentId: string;
  barberId: string;
  locationId: string;
  startAt: Date;
  endAt: Date;
  expiresAt: Date;
  depositAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaDepositHoldRepository implements DepositHoldRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAppointmentId(appointmentId: string): Promise<DepositHold | null> {
    const row = await this.prisma.depositHold.findUnique({ where: { appointmentId } });
    return row ? this.mapRow(row) : null;
  }

  async save(hold: DepositHold): Promise<void> {
    await this.prisma.depositHold.upsert({
      where: { appointmentId: hold.appointmentId },
      update: {
        barberId: hold.barberId,
        locationId: hold.locationId,
        startAt: hold.startAt,
        endAt: hold.endAt,
        expiresAt: hold.expiresAt,
        depositAmount: hold.depositAmount,
        status: hold.status,
        updatedAt: hold.updatedAt,
      },
      create: {
        id: hold.id,
        appointmentId: hold.appointmentId,
        barberId: hold.barberId,
        locationId: hold.locationId,
        startAt: hold.startAt,
        endAt: hold.endAt,
        expiresAt: hold.expiresAt,
        depositAmount: hold.depositAmount,
        status: hold.status,
        createdAt: hold.createdAt,
        updatedAt: hold.updatedAt,
      },
    });
  }

  async listByStatus(status: DepositHold['status']): Promise<DepositHold[]> {
    const rows = await this.prisma.depositHold.findMany({
      where: { status },
      orderBy: { expiresAt: 'asc' },
    });
    return rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: DepositHoldRow): DepositHold {
    return {
      id: row.id,
      appointmentId: row.appointmentId,
      barberId: row.barberId,
      locationId: row.locationId,
      startAt: row.startAt,
      endAt: row.endAt,
      expiresAt: row.expiresAt,
      depositAmount: row.depositAmount,
      status: row.status as DepositHold['status'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
