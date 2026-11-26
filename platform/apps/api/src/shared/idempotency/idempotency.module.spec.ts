// T-4207: після переробки (відповідь + заголовки) модуль мусить підняти і
// сховище, і глобальний interceptor. Без реєстрації один із них резолвиться в
// undefined — тоді mutating-ендпоінти втрачають ідемпотентність тихо.
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyModule } from './idempotency.module';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IDEMPOTENCY_STORE } from './idempotency.store';
import { PrismaIdempotencyStore } from './prisma-idempotency.store';

describe('IdempotencyModule wiring (T-4207)', () => {
  it('резолвить сховище й interceptor зі справжнього контейнера', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [IdempotencyModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(PrismaIdempotencyStore)).toBeInstanceOf(PrismaIdempotencyStore);
    expect(moduleRef.get(IDEMPOTENCY_STORE)).toBeInstanceOf(PrismaIdempotencyStore);
    expect(moduleRef.get(IdempotencyInterceptor)).toBeInstanceOf(IdempotencyInterceptor);

    await moduleRef.close();
  });
});
