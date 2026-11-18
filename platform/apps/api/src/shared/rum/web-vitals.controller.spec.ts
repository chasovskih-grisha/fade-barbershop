// Специфікація RUM-маяка (T-4204): POST /telemetry/web-vitals → 204 завжди
// (сміття не дає 4xx), лічильник видно у /metrics того ж графа (WebVitalsMetrics
// один інстанс через RumModule, який імпортує MetricsModule).
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';

describe('WebVitalsController (POST /telemetry/web-vitals)', () => {
  let app: INestApplication;

  async function boot(): Promise<void> {
    const moduleRef = await Test.createTestingModule({ imports: [MetricsModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }

  afterEach(async () => {
    if (app) await app.close();
  });

  it('204 на семпл; лічильник metric × rating у /metrics', async () => {
    await boot();
    await request(app.getHttpServer())
      .post('/telemetry/web-vitals')
      .send({ name: 'LCP', rating: 'good' })
      .expect(204);
    await request(app.getHttpServer())
      .post('/telemetry/web-vitals')
      .send({ name: 'lcp', rating: 'good' })
      .expect(204);

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.text).toContain('fade_web_vitals_samples_total{metric="lcp",rating="good"} 2');
  });

  it('невідома метрика/рейтинг → 204, серії немає (шум не засмічує логи)', async () => {
    await boot();
    await request(app.getHttpServer())
      .post('/telemetry/web-vitals')
      .send({ name: 'fid', rating: 'good' })
      .expect(204);
    await request(app.getHttpServer())
      .post('/telemetry/web-vitals')
      .send({ name: 'CLS', rating: 'average' })
      .expect(204);
    await request(app.getHttpServer()).post('/telemetry/web-vitals').send({}).expect(204);

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.text).toContain('# TYPE fade_web_vitals_samples_total counter');
    expect(res.text).not.toContain('fade_web_vitals_samples_total{');
  });
});
