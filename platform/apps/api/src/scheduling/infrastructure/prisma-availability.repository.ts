import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { Prisma } from '@prisma/client';
import { currentDb } from '../../shared/prisma/prisma-context';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BarberSchedule, AvailabilityWindowData } from '../domain/availability';
import { AvailabilityRepository } from '../domain/ports';

/** Prisma adapter for the AvailabilityRepository. */
@Injectable()
export class PrismaAvailabilityRepository implements AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}
  private db(): Prisma.TransactionClient {
    return currentDb() ?? (this.prisma as Prisma.TransactionClient);
  }

  async findByBarberAndLocation(
    barberId: string,
    locationId: string
  ): Promise<BarberSchedule | null> {
    const [assignment, user] = await Promise.all([
      this.db().staffAssignment.findUnique({
        where: { barberId_locationId: { barberId, locationId } },
        select: { id: true },
      }),
      this.db().user.findUnique({ where: { id: barberId }, select: { role: true, active: true } }),
    ]);
    if (!assignment || user?.role !== 'barber' || !user.active) return null;
    const rows = await this.db().availabilityWindow.findMany({
      where: { barberId, locationId },
      orderBy: { createdAt: 'desc' },
    });
    if (rows.length === 0) return null;
    const windows: AvailabilityWindowData[] = rows.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      start: r.start,
      end: r.end,
    }));
    const version = rows[0]?.version ?? 0;
    return BarberSchedule.reconstitute({ barberId, locationId, windows, version });
  }

  async save(schedule: BarberSchedule): Promise<void> {
    const barberId = schedule.getBarberId();
    const locationId = schedule.getLocationId();
    await this.db().availabilityWindow.deleteMany({ where: { barberId, locationId } });
    const windows = schedule.getWindows();
    if (windows.length)
      await this.db().availabilityWindow.createMany({
        data: windows.map((window) => ({
          id: uuidv7(),
          ...window,
          barberId,
          locationId,
          version: schedule.getVersion(),
        })),
      });
  }

  /** Return schedules for all barbers in a location. */
  async listAllByLocation(locationId: string): Promise<BarberSchedule[]> {
    const rows = await this.db().availabilityWindow.findMany({
      where: { locationId },
      orderBy: [{ barberId: 'asc' }, { createdAt: 'desc' }],
    });
    // Group rows by barberId
    const groups = new Map<string, AvailabilityWindowData[]>();
    const versions = new Map<string, number>();
    for (const r of rows) {
      const key = r.barberId;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push({ dayOfWeek: r.dayOfWeek, start: r.start, end: r.end });
      // Keep latest version per barber (rows are ordered by createdAt desc)
      if (!versions.has(key)) versions.set(key, r.version ?? 0);
    }
    const barberIds = [...groups.keys()];
    if (barberIds.length === 0) return [];
    const [assignments, users] = await Promise.all([
      this.db().staffAssignment.findMany({
        where: { locationId, barberId: { in: barberIds } },
        select: { barberId: true },
      }),
      this.db().user.findMany({
        where: { id: { in: barberIds }, role: 'barber', active: true },
        select: { id: true },
      }),
    ]);
    const assignedActiveIds = new Set(
      assignments.map((row) => row.barberId).filter((id) => users.some((user) => user.id === id))
    );
    const schedules: BarberSchedule[] = [];
    for (const [barberId, windows] of groups.entries()) {
      if (!assignedActiveIds.has(barberId)) continue;
      const version = versions.get(barberId) ?? 0;
      schedules.push(BarberSchedule.reconstitute({ barberId, locationId, windows, version }));
    }
    return schedules;
  }
}
