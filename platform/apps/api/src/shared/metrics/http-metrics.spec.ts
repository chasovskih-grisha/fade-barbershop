// Специфікація HttpMetrics: бакетизація маршрутів (без id/телефонів), класи
// статусів, пропуск /metrics і /health, поріг booking latency 500мс.
// Middleware тестується напряму з фейковими req/res (EventEmitter).
import { HttpMetrics } from './http-metrics';
import { EventEmitter } from 'node:events';

type FakeRes = EventEmitter & { statusCode: number };

function harness(): { metrics: HttpMetrics; hit: (reqPath: string, status: number) => jest.Mock } {
  const metrics = new HttpMetrics();
  const handler = metrics.middleware();
  return {
    metrics,
    hit(reqPath, status) {
      const res = new EventEmitter() as FakeRes;
      res.statusCode = status;
      const next = jest.fn();
      handler({ path: reqPath, originalUrl: reqPath } as never, res as never, next);
      res.emit('finish');
      return next;
    },
  };
}

describe('HttpMetrics', () => {
  it('бакетизує маршрут за першим сегментом (ід у другому не лізе в лейбл)', () => {
    const { metrics, hit } = harness();
    hit('/admin/clients/otp/request', 200);
    hit('/admin/barbers/42', 201);
    expect(metrics.snapshot().routes).toEqual({ admin: { '2xx': 2 } });
  });

  it('клас статусу: 5xx окремо від 2xx/4xx', () => {
    const { metrics, hit } = harness();
    hit('/booking/slots', 500);
    hit('/booking/slots', 500);
    hit('/booking/slots', 404);
    hit('/booking/slots', 200);
    hit('/booking/slots', 200);
    expect(metrics.snapshot().routes['booking']).toEqual({ '5xx': 2, '4xx': 1, '2xx': 2 });
  });

  it('/metrics і /health не рахуються (інфра-проби надували б SLI)', () => {
    const { metrics, hit } = harness();
    expect(hit('/metrics', 200)).toHaveBeenCalled();
    expect(hit('/health', 200)).toHaveBeenCalled();
    expect(metrics.snapshot().routes).toEqual({});
  });

  it('/telemetry теж поза SLI (RUM-маяки, не запити клієнтів до API)', () => {
    const { metrics, hit } = harness();
    hit('/telemetry/web-vitals', 204);
    expect(metrics.snapshot().routes).toEqual({});
  });

  it('Nest-quirk: повний шлях береться з originalUrl (req.path буває відносним)', () => {
    const metrics = new HttpMetrics();
    const handler = metrics.middleware();
    const res = new EventEmitter() as FakeRes;
    res.statusCode = 200;
    handler({ path: 'slots', originalUrl: '/booking/slots' } as never, res as never, jest.fn());
    res.emit('finish');
    expect(metrics.snapshot().routes['booking']).toEqual({ '2xx': 1 });
  });

  it('корінь і favicon — бакет other', () => {
    const { metrics, hit } = harness();
    hit('/', 200);
    hit('/favicon.ico', 200);
    hit('/other', 200);
    expect(metrics.snapshot().routes).toEqual({ other: { '2xx': 3 } });
  });

  it('booking slow: >=500мс рахується, швидші — ні', () => {
    const metrics = new HttpMetrics();
    metrics.recordBookingLatency(500);
    metrics.recordBookingLatency(1200);
    metrics.recordBookingLatency(499);
    expect(metrics.snapshot().bookingSlow).toBe(2);
  });

  it('middleware рахує тривалість по Date.now між стартом і finish', () => {
    const { metrics, hit } = harness();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(1_700);
    hit('/booking/slots', 200);
    expect(metrics.snapshot().bookingSlow).toBe(1); // 700мс >= 500
    nowSpy.mockRestore();
  });

  it('snapshot збирає route → клас → суму значень з пар ключів', () => {
    const metrics = new HttpMetrics();
    metrics.record('booking', '2xx');
    metrics.record('booking', '2xx');
    metrics.record('locations', '5xx');
    expect(metrics.snapshot()).toEqual({
      routes: { booking: { '2xx': 2 }, locations: { '5xx': 1 } },
      bookingSlow: 0,
    });
  });
});
