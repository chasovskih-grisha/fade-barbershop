import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SlotPolicyRepository, type SlotPolicyRow } from '../domain/ports.slot-policy';

@Injectable()
export class PrismaSlotPolicyRepository implements SlotPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async forLocation(locationId: string): Promise<SlotPolicyRow | null> {
    const row = await this.prisma.locationSlotPolicy.findUnique({
      where: { locationId },
    });
    if (!row) return null;
    return {
      id: row.id,
      locationId: row.locationId,
      stepMinutes: row.stepMinutes,
      bufferMinutes: row.bufferMinutes,
      horizonDays: row.horizonDays,
      lastMinuteMinutes: row.lastMinuteMinutes,
      timeZone: row.timeZone,
    };
  }

  async save(policy: SlotPolicyRow): Promise<void> {
    await this.prisma.locationSlotPolicy.upsert({
      where: { locationId: policy.locationId },
      create: {
        id: policy.id,
        locationId: policy.locationId,
        stepMinutes: policy.stepMinutes,
        bufferMinutes: policy.bufferMinutes,
        horizonDays: policy.horizonDays,
        lastMinuteMinutes: policy.lastMinuteMinutes,
        timeZone: policy.timeZone,
      },
      update: {
        stepMinutes: policy.stepMinutes,
        bufferMinutes: policy.bufferMinutes,
        horizonDays: policy.horizonDays,
        lastMinuteMinutes: policy.lastMinuteMinutes,
        timeZone: policy.timeZone,
      },
    });
  }
}
