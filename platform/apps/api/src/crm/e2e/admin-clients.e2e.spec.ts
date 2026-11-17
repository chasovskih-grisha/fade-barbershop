// Інтеграційні e2e-спеки CRM: список клієнтів (пошук, фільтри, сортування,
// пагінація) і валідація запиту. Картка/VIP/нотатки —
// admin-clients.profile.e2e.spec.ts, зведення — admin-clients.summary.e2e.spec.ts
// (гейт max-lines, ADR 0019). Стиль як в identity/e2e: реальна DI-онентнешна
// CrmModule, HTTP-робота через request(HttpServer); клієнти в пам'яті, адмінсесія фейкова (harness — у fakes).
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request, { type Test } from 'supertest';
import { ADMIN_COOKIE, crmTestingModule } from './admin-clients.fakes';

describe('CRM - admin/clients (e2e)', () => {
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

  // Усі ендпоїнти живуть під /admin/*, тож запит без сесії → 401.
  const call = (method: 'get' | 'post' | 'patch' | 'delete', url: string): Test =>
    request(app.getHttpServer())[method](url).set('Cookie', ADMIN_COOKIE);

  it('список клієнтів: 200, {items,total,page,pages}, пошук за іменем (T-4606a)', async () => {
    const res = await call('get', '/admin/clients').query({ search: 'Олексій' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, pages: 1 });
    expect(res.body.items).toHaveLength(1);
    // Статистика візитів іде з Booking (clientId = User.id) одним агрегатом.
    expect(res.body.items[0]).toMatchObject({
      id: 'p-1',
      userId: 'u-1',
      name: 'Олексій Петренко',
      visits: 2,
      lastVisit: '2026-10-01T12:00:00.000Z',
      loyaltyVisits: 2,
      vipDiscountPercent: 10,
    });
  });

  it('список: пагінація page/perPage і сортування visits desc (закритий набір §6.1)', async () => {
    const page2 = await call('get', '/admin/clients').query({ perPage: '2', page: '2' });
    expect(page2.body).toMatchObject({ total: 3, page: 2, pages: 2 });
    expect(page2.body.items).toHaveLength(1);
    const sorted = await call('get', '/admin/clients').query({ sort: 'visits', order: 'desc' });
    // prettier-ignore
    expect(sorted.body.items.map((i: { id: string }) => i.id)).toEqual(['p-1', 'p-3', 'p-2']);
  });

  it('список: фільтри loyaltyStatus і locationId (клієнти локації, гість без профілю мовчки)', async () => {
    const inactive = await call('get', '/admin/clients').query({ loyaltyStatus: 'inactive' });
    expect(inactive.body.items.map((i: { id: string }) => i.id)).toEqual(['p-2']);
    const atLocation = await call('get', '/admin/clients').query({ locationId: 'loc-1' });
    // prettier-ignore
    expect(atLocation.body.items.map((i: { id: string }) => i.id).sort()).toEqual(['p-1', 'p-3']);
  });

  it('список: некоректні sort/order/perPage/page/loyaltyStatus/period → 400', async () => {
    await call('get', '/admin/clients').query({ sort: 'ltv' }).expect(400);
    await call('get', '/admin/clients').query({ order: 'up' }).expect(400);
    await call('get', '/admin/clients').query({ perPage: '101' }).expect(400);
    await call('get', '/admin/clients').query({ page: '0' }).expect(400);
    await call('get', '/admin/clients').query({ loyaltyStatus: 'vip' }).expect(400);
    await call('get', '/admin/clients').query({ period: '1d' }).expect(400);
    // Кордоні значення валідні: perPage=100 і кожен період контракту.
    await call('get', '/admin/clients').query({ perPage: '100' }).expect(200);
    await call('get', '/admin/clients').query({ period: '90d' }).expect(200);
  });

  it('без адмін-сесії всі ендпоїнти 401', async () => {
    await request(app.getHttpServer()).get('/admin/clients').expect(401);
    await request(app.getHttpServer()).get('/admin/clients/p-1').expect(401);
  });
});
