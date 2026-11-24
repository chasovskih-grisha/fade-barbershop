// T-230: політика self-service читається з User (selfSchedule), а не з окремої
// таблиці. Немає права — барбер бачить графік, але не редагує (SCH-001).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { BarberSchedulePolicy } from '../domain/barber-self-service';
import type { SchedulePolicyRepository } from '../domain/ports';

@Injectable()
export class PrismaSchedulePolicyRepository implements SchedulePolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findForBarber(barberId: string): Promise<BarberSchedulePolicy | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: barberId },
      select: { role: true, active: true, selfSchedule: true },
    });
    if (!user || user.role !== 'barber' || !user.active) return null;
    return {
      selfService: user.selfSchedule,
      // Окремий дозвіл «виходити за OpeningHours» не входить у T-230:
      // прапорець selfSchedule делегує лише редагування в межах годин.
      allowOutsideHours: false,
    };
  }
}
