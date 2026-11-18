// Транзакційний контекст Prisma: репозиторії адаптерів читають активний tx-клієнт
// чи базовий. UnitOfWork: один use case = одна транзакція (identity README: "Транзакція = один use case").

import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma } from '@prisma/client';
import type { UnitOfWork } from '../../identity/domain/ports';
import { PrismaService } from './prisma.service';

const storage = new AsyncLocalStorage<Prisma.TransactionClient>();

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    if (storage.getStore()) return work();
    return this.prisma.$transaction((tx) => storage.run(tx, work) as Promise<T>);
  }
}

// Активний tx-клієнт усередині use case (null → операції поза транзакцією).
export function currentDb(): Prisma.TransactionClient | null {
  return storage.getStore() ?? null;
}
