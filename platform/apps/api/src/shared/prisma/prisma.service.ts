// PrismaService — єдиний PrismaClient для контекстів. Nest DI + життєвий цикл.
// Prisma не виходить за інфраструктуру (ADR 0003: "Prisma не виходить за infrastructure/").

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { applyPoolSettings, resolvePoolSettings } from '../database/pool/database-url';

/**
 * DATABASE_URL із pool-параметрами (T-4803). Немає URL або він некоректний —
 * лишаємо як є: Prisma сама скаже про конфіг, а ліміти — невдалий привід
 * падати на boot.
 */
function pooledUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    return applyPoolSettings(raw, resolvePoolSettings());
  } catch {
    return raw;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = pooledUrl();
    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
