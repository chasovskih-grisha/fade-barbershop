// Prisma-адаптер порту VisitRepository (crm, T-061): upsert за appointmentId —
// ідемпотентний запис факту; читачі — за clientId/barberId у порядку спадання
// occurredAt. Мапінг рядка — у prisma-visit.row.ts (гейт max-lines).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { VisitRepository } from '../domain/visit.repository';
import type { Visit } from '../domain/visit';
import { toPrismaVisit, toDomainVisit, type PrVisit } from './prisma-visit.row';

@Injectable()
export class PrismaVisitRepository implements VisitRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAppointmentId(appointmentId: string): Promise<Visit | null> {
    const row = await this.prisma.visit.findUnique({ where: { appointmentId } });
    return row ? toDomainVisit(row as PrVisit) : null;
  }

  async save(visit: Visit): Promise<void> {
    const data = toPrismaVisit(visit);
    await this.prisma.visit.upsert({
      where: { appointmentId: visit.appointmentId },
      create: data,
      update: data,
    });
  }

  async listByClientId(clientId: string): Promise<Visit[]> {
    const rows = await this.prisma.visit.findMany({
      where: { clientId },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map((row) => toDomainVisit(row as PrVisit));
  }
}
