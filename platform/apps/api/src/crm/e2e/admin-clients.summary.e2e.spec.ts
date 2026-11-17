// Інтеграційні e2e-спеки зведення списку клієнтів (T-4606b): контракт
// `summary.total === total`, прив'язка цифр до фільтрів (а не до бази) і
// поведінка вікна `period`. Список — admin-clients.e2e.spec.ts. Годинник
// фіксований у harness (SUMMARY_NOW), тож межі вікна перевіряються точно.
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request, { type Test } from 'supertest';
import { ADMIN_COOKIE, SUMMARY_NOW, crmTestingModule } from './admin-clients.fakes';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBefore = (n: number) => new Date(SUMMARY_NOW.getTime() - n * DAY_MS);

describe('CRM - admin/clients summary (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await crmTestingModule().compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const call = (url: string): Test =>
    request(app.getHttpServer()).get(url).set('Cookie', ADMIN_COOKIE);

  it('summary.total === total і цифри по всьому фільтру (T-4606b)', async () => {
    const res = await call('/admin/clients');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.summary).toMatchObject({
      total: 3,
      period: '30d',
      // Вікно 30d від фіксованого «зараз»: 09-10…10-10 — усі чотири візити.
      from: daysBefore(30).toISOString(),
      to: SUMMARY_NOW.toISOString(),
      visits: 4,
      revenue: 1300,
      avgTicket: 433,
      noShowRate: 0.25,
      quietClients: 0,
      repeatShare: 0.6667,
      loyalty: { none: 1, progress: 2, freeVisit: 0, cycle: 0 },
      // prettier-ignore
      locations: { byLocation: [{ locationId: 'loc-1', count: 1 }, { locationId: 'loc-2', count: 1 }],
        noVisit: 1 },
    });
    // Цифри зведення не залежать від пагінації: сторінка менша за фільтр.
    const page = await call('/admin/clients?perPage=1&page=2');
    expect(page.body.items).toHaveLength(1);
    expect(page.body.summary).toEqual(res.body.summary);
  });

  it('цифри прив’язані до фільтрів (locationId), не до бази', async () => {
    const res = await call('/admin/clients?locationId=loc-1');
    expect(res.body.total).toBe(2);
    expect(res.body.summary.total).toBe(2);
    expect(res.body.summary.locations).toEqual({
      byLocation: [
        { locationId: 'loc-1', count: 1 },
        { locationId: 'loc-2', count: 1 },
      ],
      noVisit: 0,
    });
  });

  it('period звужує лише вікно — 7d відкидає старші візити', async () => {
    const week = await call('/admin/clients?period=7d');
    expect(week.body.summary).toMatchObject({
      period: '7d',
      from: daysBefore(7).toISOString(),
      visits: 2,
      revenue: 300,
      avgTicket: 300,
      noShowRate: 0.5,
      newClients: 0,
    });
    expect(week.body.total).toBe(3);
  });
});
