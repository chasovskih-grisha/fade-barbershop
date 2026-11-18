// E2E: адмін-вхід — невідомий username / не-admin (T-013).
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MemUsers } from './admin-client-otp.fakes';
import { createAdminLoginApp, seedAdminLogin } from './admin-login.e2e.harness';

describe('Admin login (e2e) — auth failures', () => {
  let app: INestApplication;
  let users: MemUsers;

  beforeAll(async () => {
    ({ app, users } = await createAdminLoginApp());
  });

  afterAll(async () => app.close());

  it('невідомий username → 401', async () => {
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ username: 'nobody', password: 'FadeSecret2026' })
      .expect(401);
  });

  it('не-admin акаунт → 403', async () => {
    await seedAdminLogin(users, {
      username: 'walker',
      password: 'FadeSecret2026',
      role: 'client',
    });
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ username: 'walker', password: 'FadeSecret2026' })
      .expect(403);
  });
});
