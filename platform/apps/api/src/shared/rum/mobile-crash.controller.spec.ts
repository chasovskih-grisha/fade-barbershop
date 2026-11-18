// Специфікація краш-маяка (T-4443): POST /telemetry/mobile-crash → 204 завжди
// (сміття не дає 4xx), лічильник видно у /metrics того ж графа (MobileCrashMetrics
// один інстанс через RumModule, який імпортує MetricsModule).
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';

describe('MobileCrashController (POST /telemetry/mobile-crash)', () => {
  let app: INestApplication;

  async function boot(): Promise<void> {
    const moduleRef = await Test.createTestingModule({ imports: [MetricsModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }

  afterEach(async () => {
    if (app) await app.close();
  });

  it('204 на звіт; лічильник класу × версія × платформа у /metrics', async () => {
    await boot();
    const body = {
      crashClass: 'RangeError: invalid array length',
      appVersion: '1.2.0',
      platform: 'android',
    };
    await request(app.getHttpServer()).post('/telemetry/mobile-crash').send(body).expect(204);
    await request(app.getHttpServer()).post('/telemetry/mobile-crash').send(body).expect(204);

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.text).toContain(
      'fade_mobile_crashes_total{crash_class="RangeError: invalid array length",app_version="1.2.0",platform="android"} 2'
    );
  });

  it('невідома платформа/порожнє тіло → 204, серії немає (шум не засмічує логи)', async () => {
    await boot();
    await request(app.getHttpServer())
      .post('/telemetry/mobile-crash')
      .send({ crashClass: 'E', appVersion: '1.2.0', platform: 'web' })
      .expect(204);
    await request(app.getHttpServer()).post('/telemetry/mobile-crash').send({}).expect(204);

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.text).toContain('# TYPE fade_mobile_crashes_total counter');
    expect(res.text).not.toContain('fade_mobile_crashes_total{');
  });
});
