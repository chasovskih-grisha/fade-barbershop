// E2E: адмін-вхід за username + password (T-013): успіх і /me по cookie.
// T-4411: успішні й невдалі входи потрапляють у журнал (MemLoginAudit).
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MemLoginAudit, MemUsers } from './admin-client-otp.fakes';
import { SESSION_COOKIE_NAME } from '../infrastructure/session-cookie';
import { createAdminLoginApp, seedAdminLogin } from './admin-login.e2e.harness';

describe('Admin login (e2e)', () => {
  let app: INestApplication;
  let users: MemUsers;
  let audit: MemLoginAudit;

  beforeAll(async () => {
    ({ app, users, audit } = await createAdminLoginApp());
  });

  afterAll(async () => app.close());

  it('успіх → 200, cookie адміна, /me, запис у журнал', async () => {
    const owner = seedAdminLogin(users, {
      username: 'owner',
      password: 'FadeSecret2026',
      role: 'admin',
    });
    const login = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ username: 'owner', password: 'FadeSecret2026' })
      .expect(200);
    expect(login.body.token).toHaveLength(64);
    expect(login.body.user.username).toBe('owner');
    const setCookie = login.headers['set-cookie'] ?? [];
    const raw = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
    expect(raw).toContain(`${SESSION_COOKIE_NAME}=`);
    const cookie =
      ((Array.isArray(setCookie) ? setCookie[0] : setCookie) ?? '').split(';')[0] ?? '';
    const me = await request(app.getHttpServer())
      .get('/admin/auth/me')
      .set('Cookie', cookie)
      .expect(200);
    expect(me.body.role).toBe('admin');
    expect(me.body.id).toBe(owner.id);
    const ownerRows = audit.rows.filter((r) => r.username === 'owner');
    expect(ownerRows).toHaveLength(1);
    expect(ownerRows[0]).toMatchObject({
      userId: owner.id,
      username: 'owner',
      ok: true,
      actorId: owner.id,
    });
  });

  it('невірний пароль → 401 + невдача в журналі', async () => {
    seedAdminLogin(users, {
      username: 'owner2',
      password: 'FadeSecret2026',
      role: 'admin',
    });
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ username: 'owner2', password: 'WrongPass789' })
      .expect(401);
    expect(audit.rows.filter((r) => r.username === 'owner2').map((r) => r.ok)).toEqual([false]);
  });
});
