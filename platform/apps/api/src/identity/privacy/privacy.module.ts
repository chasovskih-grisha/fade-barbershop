// PrivacyModule (T-4805): заявка на стирання, воркер і комплаєнс-звіт.
// Реєструється в AppModule; Prisma і S3 надаються локально (як у scheduling).
import { Logger, Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { S3PhotoStorage } from '../../haircut-ai/infrastructure/s3-photo-storage';
import { PrismaOtpChallengeRepository } from '../infrastructure/prisma-otp-challenge-repository';
import { ERASURE_OTP, ERASURE_OBJECTS, ERASURE_STORE } from './application/erasure.ports';
import { RequestErasure } from './application/request-erasure';
import { RunErasure } from './application/run-erasure';
import { PrismaErasureStore } from './infrastructure/prisma-erasure.store';
import { OtpChallengeVerifier, S3ErasureObjects } from './infrastructure/erasure.adapters';
import { AccountErasureController, AccountErasureReportController } from './infrastructure/erasure.controller';
import { ErasureWorker } from './infrastructure/erasure.worker';

const logger = new Logger('AccountErasure');

@Module({
  providers: [
    PrismaService,
    PrismaOtpChallengeRepository,
    S3PhotoStorage,
    PrismaErasureStore,
    { provide: ERASURE_STORE, useExisting: PrismaErasureStore },
    { provide: ERASURE_OBJECTS, useClass: S3ErasureObjects },
    { provide: ERASURE_OTP, useClass: OtpChallengeVerifier },
    {
      provide: RequestErasure,
      useFactory: (store, otp) => new RequestErasure({ store, otp }),
      inject: [ERASURE_STORE, ERASURE_OTP],
    },
    {
      provide: RunErasure,
      useFactory: (store, objects) =>
        new RunErasure({
          store,
          objects,
          audit: (event) => logger.log(JSON.stringify(event)),
        }),
      inject: [ERASURE_STORE, ERASURE_OBJECTS],
    },
    ErasureWorker,
  ],
  controllers: [AccountErasureController, AccountErasureReportController],
})
export class PrivacyModule {}
