// Специфікація /metrics: Content-Type Prometheus, мінімальна збірка без
// outbox-секції, проба в графі — датчики лагу, спільний інстанс лічильників
// геокодера з /health (LocationsModule у графі).
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { MetricsModule } from './metrics.module';
import { HttpMetrics } from './http-metrics';
import { LocationsModule } from '../../locations/infrastructure/locations.module';
import { GeocoderMetrics } from '../../locations/infrastructure/geocoder-metrics';
import { OutboxLagProbe } from '../../scheduling/infrastructure/appointment-activity.projection';
import { PrismaService } from '../prisma/prisma.service';

describe('MetricsController (GET /metrics)', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
  });

  it('мінімальна збірка: text/plain; version=0.0.4, процес + геокодер, без outbox', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [MetricsModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.headers['content-type']).toContain('version=0.0.4');
    expect(res.text).toContain('# TYPE fade_uptime_seconds counter');
    expect(res.text).toContain('fade_nodejs_version_info{version=');
    expect(res.text).toContain('fade_geocoder_cache_hit 0');
    expect(res.text).not.toContain('fade_outbox');
    expect(res.text).not.toContain('fade_rate_limit');
    // SLI-секція є (заголовки), але без зразків: middleware у тестах не чіпляється.
    expect(res.text).toContain('# TYPE fade_http_requests_total counter');
    expect(res.text).not.toContain('fade_http_requests_total{');
  });

  it('проба в графі: outbox-датчики pending і oldest pending', async () => {
    // prettier-ignore
    const moduleRef = await Test.createTestingModule({ imports: [MetricsModule], providers: [{ provide: OutboxLagProbe, useValue: { lag: async () => ({ pending: 3, oldestPendingMs: 1500 }) } }] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.text).toContain('fade_outbox_pending_messages 3');
    expect(res.text).toContain('fade_outbox_oldest_pending_seconds 1.5');
  });

  it('SLI-лічильники: route × статус-клас + booking slow (SLO, docs/slo.md)', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [MetricsModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    const http = moduleRef.get(HttpMetrics); // moduleRef-резолв у контролері (гейт max-params)
    http.record('booking', '5xx');
    http.record('booking', '5xx');
    http.record('booking', '2xx');
    http.record('identity', '2xx');
    http.recordBookingLatency(700);
    http.recordBookingLatency(120); // швидше за 500мс — не рахується

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.text).toContain('fade_http_requests_total{route="booking",code="5xx"} 2');
    expect(res.text).toContain('fade_http_requests_total{route="booking",code="2xx"} 1');
    expect(res.text).toContain('fade_http_requests_total{route="identity",code="2xx"} 1');
    expect(res.text).toContain('fade_http_booking_slow_total 1');
  });

  it('лічильники геокодера — спільний інстанс з /health (ростуть разом)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LocationsModule, MetricsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $connect: async () => undefined, $disconnect: async () => undefined })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();

    moduleRef.get(GeocoderMetrics).increment('cache_hit');
    const res = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(res.text).toContain('fade_geocoder_cache_hit 1');
  });
});
