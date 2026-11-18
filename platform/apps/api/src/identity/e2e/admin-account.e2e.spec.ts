// E2E T-4411: зміна власного пароля + скидання (інвалідація сесій).
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MemUsers } from './admin-client-otp.fakes';
import { createAdminAccountApp, loginAs, seedAdmin } from './admin-account.e2e.harness';

describe('Admin account lifecycle (e2e, T-4411) — password', () => {
  let app: INestApplication;
  let users: MemUsers;

  beforeAll(async () => {
    ({ app, users } = await createAdminAccountApp());
  });

  afterAll(async () => app.close());

  it('зміна власного пароля: старий не працює, новий працює, поточна сесія жива', async () => {
    seedAdmin(users, 'owner', 'OldPass123');
    const cookie = await loginAs(app, 'owner', 'OldPass123');
    await request(app.getHttpServer())
      .post('/admin/account/password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'OldPass123', newPassword: 'NewPass456' })
      .expect(201);
    // Поточна сесія жива (свідомо не інвалідовуємо власну зміну):
    await request(app.getHttpServer()).get('/admin/auth/me').set('Cookie', cookie).expect(200);
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ username: 'owner', password: 'OldPass123' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ username: 'owner', password: 'NewPass456' })
      .expect(200);
  });

  it('РИЗИК T-4411: скидання пароля іншому адміну інвалідує його активні сесії', async () => {
    seedAdmin(users, 'boss', 'BossPass123');
    seedAdmin(users, 'target', 'TargetPass123');
    const targetCookie = await loginAs(app, 'target', 'TargetPass123');
    await request(app.getHttpServer())
      .get('/admin/auth/me')
      .set('Cookie', targetCookie)
      .expect(200);

    const bossCookie = await loginAs(app, 'boss', 'BossPass123');
    const reset = await request(app.getHttpServer())
      .post('/admin/admins/target/password')
      .set('Cookie', bossCookie)
      .expect(201);
    expect(reset.body.newPassword).toMatch(/^Fade-/);

    // Та сама cookie цілі — більше не працює (сесії закриті):
    await request(app.getHttpServer())
      .get('/admin/auth/me')
      .set('Cookie', targetCookie)
      .expect(401);
    // Reset свідомо деактивує ціль (безпека за замовчуванням): адмін передає
    // одноразовий пароль і активує обліковку окремим рішенням → 403, не 401.
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ username: 'target', password: reset.body.newPassword })
      .expect(403);
  });
});
