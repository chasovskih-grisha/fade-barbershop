// Інтеграційні e2e-спеки картки клієнта: читання профілю, VIP-знижка, нотатки.
// Список і валідація — admin-clients.e2e.spec.ts, зведення —
// admin-clients.summary.e2e.spec.ts. Harness — admin-clients.fakes.ts.
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request, { type Test } from 'supertest';
import { ADMIN_COOKIE, crmTestingModule } from './admin-clients.fakes';

describe('CRM - admin/clients/:id (e2e)', () => {
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

  const call = (method: 'get' | 'post' | 'patch' | 'delete', url: string): Test =>
    request(app.getHttpServer())[method](url).set('Cookie', ADMIN_COOKIE);

  it('GET /admin/clients/:id — 200 для відомого, 404 для неіснуючого', async () => {
    const ok = await call('get', '/admin/clients/p-1');
    expect(ok.status).toBe(200);
    expect(ok.body).toHaveProperty('name', 'Олексій Петренко');
    await call('get', '/admin/clients/p-missing').expect(404);
  });

  it('PATCH /admin/clients/:id/vip-discount — 200, скидання в 0', async () => {
    const set = await call('patch', '/admin/clients/p-1/vip-discount').send({
      percent: 20,
      changedBy: 'admin-1',
    });
    expect(set.status).toBe(200);
    expect(set.body).toHaveProperty('vipDiscountPercent', 20);
    const clear = await call('patch', '/admin/clients/p-1/vip-discount').send({
      percent: 0,
      changedBy: 'admin-2',
    });
    expect(clear.status).toBe(200);
    expect(clear.body).toHaveProperty('vipDiscountPercent', 0);
    await call('patch', '/admin/clients/p-missing/vip-discount')
      .send({ percent: 10, changedBy: 'admin-1' })
      .expect(404);
  });

  it('POST /admin/clients/:id/notes — 201, нотатка зберігається, VIEWER-видність', async () => {
    const created = await call('post', '/admin/clients/p-1/notes').send({
      text: 'любить еспресо',
      authorId: 'b-1',
      authorRole: 'barber',
    });
    // Створення нотатки — 201 Created (стандартний код для POST із тілом-сутністю).
    expect(created.status).toBe(201);
    expect(created.body).toHaveProperty('note.text', 'любить еспресо');
    expect(created.body).toHaveProperty('note.visibleToClient', false);
    // Окремого GET /notes немає: нотатки видно у профілі клієнта.
    const profile = await call('get', '/admin/clients/p-1');
    expect(profile.body.notes).toHaveLength(1);
    expect(profile.body.notes[0].text).toBe('любить еспресо');
  });

  it('DELETE /admin/clients/:id/notes/:noteId — 200, видалення — 404', async () => {
    const note = await call('post', '/admin/clients/p-1/notes').send({
      text: 'видалити мене',
      authorId: 'b-1',
      authorRole: 'admin',
    });
    const id = (note.body.note as { id: string }).id;
    expect(id).toBeTruthy();
    await call('delete', `/admin/clients/p-1/notes/${id}`).expect(200);
    await call('delete', `/admin/clients/p-1/notes/${id}`).expect(404);
  });
});
