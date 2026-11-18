// HTTP-перевірка самого SSE-транспорту (T-045): @Sse мусить віддати
// text/event-stream і доправити опубліковане сповіщення в тілі потоку. Це —
// найризикованіша ланка фічі (юніт-спеки лишаються на рівні Observable),
// тож піднімаємо справжній HTTP-сервер лише з RealtimeModule — без AppModule і
// без БД (PrismaService підмінено заглушкою).
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import http from 'node:http';
import { PrismaService } from '../shared/prisma/prisma.service';
import { AdminLiveFeed } from './admin-live-feed';
import { RealtimeModule } from './realtime.module';

const NOTICE = { type: 'scheduling.appointment.booked', appointmentId: 'apt-1' };

describe('admin/live/events (SSE, T-045)', () => {
  let app: INestApplication;
  let feed: AdminLiveFeed;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [RealtimeModule] })
      .overrideProvider(PrismaService)
      .useValue({ outboxMessage: { findMany: jest.fn().mockResolvedValue([]) } })
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
    feed = moduleRef.get(AdminLiveFeed);
  });

  afterAll(async () => {
    await app.close();
  });

  it('віддає text/event-stream і шле подію appointment із сигналом', async () => {
    const { port } = app.getHttpServer().address() as { port: number };
    const host = '127.0.0.1';
    const body = await new Promise<string>((resolve) => {
      const tick = setInterval(() => feed.publish(NOTICE), 100);
      const cleanup = () => clearInterval(tick);
      const req = http.get(
        { host, port, path: '/admin/live/events', headers: { accept: 'text/event-stream' } },
        (res) => {
          expect(String(res.headers['content-type'])).toContain('text/event-stream');
          let chunk = '';
          res.on('data', (c: Buffer) => (chunk += c.toString()));
          res.on('end', () => {
            cleanup();
            resolve(chunk);
          });
          // Потік SSE — не закінчується, аж ніж клієнт закриє з'єднання.
          setTimeout(() => {
            req.destroy();
            cleanup();
            resolve(chunk);
          }, 2_500);
        }
      );
      req.on('error', () => {
        cleanup();
        resolve('');
      });
    });

    expect(body).toContain('event: appointment');
    expect(body).toContain(`"appointmentId":"${NOTICE.appointmentId}"`);
  });
});
