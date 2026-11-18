// Prisma-адаптер правил surge (T-4811): активні правила локації + мережеві.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { SurgeRule, SeniorityTier } from '../domain/surge-rule';
import type { SurgeRuleStore } from '../application/surge-quote';

@Injectable()
export class PrismaSurgeRuleStore implements SurgeRuleStore {
  constructor(private readonly prisma: PrismaService) {}

  async activeRules(locationId: string): Promise<SurgeRule[]> {
    const rows = await this.prisma.surgeRule.findMany({
      where: { active: true, OR: [{ locationId }, { locationId: null }] },
    });
    return rows.map((row) => ({
      id: row.id,
      locationId: row.locationId,
      dayOfWeek: row.dayOfWeek,
      fromMinute: row.fromMinute,
      toMinute: row.toMinute,
      seniorityTier: row.seniorityTier as SeniorityTier | null,
      multiplierBp: row.multiplierBp,
      active: row.active,
    }));
  }
}
