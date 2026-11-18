// RetentionModule (T-4490): політика класифікації + добовий purge + аудит.
// PrismaService — локально (спільного @Global PrismaModule немає).
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaRetentionStore } from './prisma-retention.store';
import { PurgeExpiredData } from './purge-expired-data';
import { RetentionPurgeWorker } from './retention.worker';
import { legalHolds } from './retention-policy';
import { RETENTION_STORE } from './retention.ports';

@Module({
  providers: [
    PrismaService,
    PrismaRetentionStore,
    { provide: RETENTION_STORE, useExisting: PrismaRetentionStore },
    {
      provide: PurgeExpiredData,
      useFactory: (store) => new PurgeExpiredData({ store, holds: legalHolds() }),
      inject: [RETENTION_STORE],
    },
    RetentionPurgeWorker,
  ],
  exports: [PurgeExpiredData],
})
export class RetentionModule {}
