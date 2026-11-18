// DatabaseHealthContributor — database-секція /health: перевірка зв'язку з БД
// через SELECT 1 з вимірюванням латентності та м'яким відхиленням у деградацію
// замість падіння 503 (дух GeocoderHealth / OutboxHealth).

import { Injectable, Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

export interface DatabaseHealthSection {
  status: 'connected' | 'degraded' | 'disconnected' | 'not_configured';
  latencyMs: number | null;
  error: string | null;
}

@Injectable()
export class DatabaseHealthContributor {
  private readonly logger = new Logger(DatabaseHealthContributor.name);

  async snapshot(prisma: PrismaService | null): Promise<DatabaseHealthSection> {
    if (!prisma) {
      return { status: 'not_configured', latencyMs: null, error: null };
    }
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      return { status: 'connected', latencyMs, error: null };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const errMessage = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`database health probe failed: ${errMessage}`);
      return { status: 'degraded', latencyMs, error: errMessage };
    }
  }
}
