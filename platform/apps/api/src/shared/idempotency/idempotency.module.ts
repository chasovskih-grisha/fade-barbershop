// IdempotencyModule (T-4207): сховище на Prisma + глобальний interceptor для
// mutating-ендпоінтів. Глобальна реєстрація — APP_INTERCEPTOR у app.module.ts.
import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaIdempotencyStore } from './prisma-idempotency.store';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IDEMPOTENCY_STORE } from './idempotency.store';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaIdempotencyStore,
    { provide: IDEMPOTENCY_STORE, useExisting: PrismaIdempotencyStore },
    IdempotencyInterceptor,
  ],
  exports: [IdempotencyInterceptor, IDEMPOTENCY_STORE],
})
export class IdempotencyModule {}
