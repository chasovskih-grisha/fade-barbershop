// Prisma-адаптер архіву (T-4804): застарілі бронювання пачками, видалення
// лише після підтвердженого checksum, аудит прогону в ArchiveRun.
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../prisma/prisma.service';
import type { ArchiveRunRecord, ArchiveStore, ArchivedBooking } from './archive.ports';

@Injectable()
export class PrismaArchiveStore implements ArchiveStore {
  constructor(private readonly prisma: PrismaService) {}

  async selectExpired(cutoff: Date, limit: number): Promise<ArchivedBooking[]> {
    const rows = await this.prisma.booking.findMany({
      where: { end: { lt: cutoff } },
      orderBy: { end: 'asc' },
      take: limit,
    });
    // JSON-серіалізація нормалізує Date → ISO, тож архів самодостатній.
    return rows.map((row) => JSON.parse(JSON.stringify(row)) as ArchivedBooking);
  }

  async deleteByIds(ids: string[]): Promise<number> {
    const result = await this.prisma.booking.deleteMany({ where: { id: { in: ids } } });
    return result.count;
  }

  async countExpired(cutoff: Date): Promise<number> {
    return this.prisma.booking.count({ where: { end: { lt: cutoff } } });
  }

  async recordRun(record: ArchiveRunRecord, at: Date): Promise<void> {
    await this.prisma.archiveRun.create({
      data: {
        id: uuidv7(),
        cutoff: new Date(record.cutoff),
        archived: record.archived,
        remaining: record.remaining,
        keys: record.keys,
        checksums: record.checksums,
        ranAt: at,
      },
    });
  }
}
