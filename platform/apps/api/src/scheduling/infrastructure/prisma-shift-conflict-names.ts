// Імена для рядка конфлікту недоступності (T-4616b): засновник має бачити, чий
// візит він переносить чи скасовує, а не лише booking id. Дані — з identity
// (User.name) і services (Service.name); порожнє ім'я лишається null, і рядок
// показує лише час.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { ShiftConflictNames } from '../application/list-shift-conflicts.use-case';

@Injectable()
export class PrismaShiftConflictNames implements ShiftConflictNames {
  constructor(private readonly prisma: PrismaService) {}

  async clientName(clientId: string | null): Promise<string | null> {
    if (!clientId) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true },
    });
    return user?.name?.trim() || null;
  }

  async serviceName(serviceId: string | null): Promise<string | null> {
    if (!serviceId) return null;
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { name: true },
    });
    return service?.name?.trim() || null;
  }
}
