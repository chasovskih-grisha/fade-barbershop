// Специфікація /health: мінімальна збірка (uptime + нульові лічильники),
// збірка з LocationsModule (спільний GeocoderMetrics — лічильники ростуть),
// і режими сховищ per адаптер. Тестовий модуль без Prisma.

import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthModule } from './health.module';
import { GeocoderMetrics } from '../../locations/infrastructure/geocoder-metrics';
import { LocationsModule } from '../../locations/infrastructure/locations.module';
import { OutboxLagProbe } from '../../scheduling/infrastructure/appointment-activity.projection';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorTrackerService } from '../logging/error-tracker.service';

describe('HealthController (/health)', () => {
  // env-змінні фабрики не мають протікати між файлами в одному worker-і.
  beforeEach(() => {
    delete process.env.FADE_GEOCODER_STORE;
    delete process.env.FADE_REDIS_URL;
  });
  afterEach(() => {
    delete process.env.FADE_GEOCODER_STORE;
    delete process.env.FADE_REDIS_URL;
  });

  it('мінімальна збірка: status/uptimeMs/geocoder.counters нульові', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [HealthModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await moduleRef.get(HealthController).check();
    expect(res.status).toBe('ok');
    expect(res.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(res.geocoder.counters).toMatchObject({
      cache_hit: 0,
      cache_miss: 0,
      rate_limit_rejected: 0,
      tombstoned: 0,
      provider_failure: 0,
      provider_success: 0,
    });
    expect(res.geocoder.stores).toMatchObject({
      nominatim: { effective: 'local' },
      google: { effective: 'local' },
    });

    await app.close();
  });

  it('з LocationsModule: спільні лічильники — попадання в кеш видно у /health', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [LocationsModule] })
      .overrideProvider(PrismaService)
      .useValue({ $connect: async () => undefined, $disconnect: async () => undefined })
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    const metrics = moduleRef.get(GeocoderMetrics);
    metrics.increment('cache_hit');
    metrics.increment('rate_limit_rejected');
    metrics.increment('provider_failure');

    const res = await moduleRef.get(HealthController).check();
    expect(res.geocoder.counters).toMatchObject({
      cache_hit: 1,
      rate_limit_rejected: 1,
      provider_failure: 1,
    });
    await app.close();
  });

  it('мінімальна збірка: секція outbox деградує до null (проби немає в графі)', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [HealthModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    const res = await moduleRef.get(HealthController).check();
    expect(res.outbox).toBeNull();
    await app.close();
  });

  it('проба в графі (useValue): секція outbox показує лаг', async () => {
    // prettier-ignore
    const moduleRef = await Test.createTestingModule({ imports: [HealthModule], providers: [{ provide: OutboxLagProbe, useValue: { lag: async () => ({ pending: 3, oldestPendingMs: 1500 }) } }] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    const res = await moduleRef.get(HealthController).check();
    expect(res.outbox).toMatchObject({ pending: 3, oldestPendingMs: 1500, warning: null });
    await app.close();
  });

  it('ErrorTrackerService в графі: секція errors показує записані помилки', async () => {
    const errorTracker = new ErrorTrackerService();
    errorTracker.recordError('TestContext', 'Test error message', undefined, 500);

    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
      providers: [{ provide: ErrorTrackerService, useValue: errorTracker }],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await moduleRef.get(HealthController).check();
    expect(res.errors).toMatchObject({
      totalRecorded: 1,
      recentErrors: [
        expect.objectContaining({
          context: 'TestContext',
          message: 'Test error message',
          statusCode: 500,
        }),
      ],
    });
    await app.close();
  });
});
