import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { StaffAssignment } from '../domain/staff-assignment';
import type { StaffAssignmentRepository } from '../domain/ports';

@Injectable()
export class PrismaStaffAssignmentRepository implements StaffAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}
  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }
  async findById(id: string): Promise<StaffAssignment | null> {
    const row = await this.db().staffAssignment.findUnique({ where: { id } });
    return row ? StaffAssignment.reconstitute(row) : null;
  }
  async findByBarberAndLocation(
    barberId: string,
    locationId: string
  ): Promise<StaffAssignment | null> {
    const row = await this.db().staffAssignment.findUnique({
      where: { barberId_locationId: { barberId, locationId } },
    });
    return row ? StaffAssignment.reconstitute(row) : null;
  }
  async save(value: StaffAssignment): Promise<void> {
    await this.db().staffAssignment.create({
      data: {
        id: value.id,
        barberId: value.barberId,
        locationId: value.locationId,
        createdAt: value.createdAt,
      },
    });
  }
  async delete(id: string): Promise<void> {
    await this.db().staffAssignment.delete({ where: { id } });
  }
  async listByLocation(locationId: string): Promise<StaffAssignment[]> {
    return (
      await this.db().staffAssignment.findMany({
        where: { locationId },
        orderBy: { createdAt: 'asc' },
      })
    ).map(StaffAssignment.reconstitute);
  }
  async listByBarber(barberId: string): Promise<StaffAssignment[]> {
    return (
      await this.db().staffAssignment.findMany({
        where: { barberId },
        orderBy: { createdAt: 'asc' },
      })
    ).map(StaffAssignment.reconstitute);
  }
}
