// E2E: reuse попереднього refresh і прострочений refresh (T-014).
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createRefreshSessionApp, loginMobile, type RefreshE2eCtx } from './refresh-session.e2e.harness';

describe('Mobile refresh flow (e2e, T-014) — reuse & expiry', () => {
  let app: INestApplication;
  let ctx: RefreshE2eCtx;

  beforeAll(async () => {
    ctx = await createRefreshSessionApp();
    app = ctx.app;
  });

  afterAll(async () => app.close());

  it('reuse ПОПЕРЕДНЬОГО refresh (one-step історія) → 401 REUSE, сесія повністю мертва', async () => {
    const login = await loginMobile(ctx, '555555');
    const { refreshToken } = login.body as { refreshToken: string };

    // Ротація: refreshToken (r0) → rotated r1 (previous = r0).
    const rotated = await request(app.getHttpServer())
      .post('/identity/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    // Граємо r0 — попередній refresh (загублена відповідь/крадіжка).
    await request(app.getHttpServer())
      .post('/identity/auth/refresh')
      .send({ refreshToken })
      .expect(401)
      .expect((res) => expect(res.body.code).toBe('REFRESH_TOKEN_REUSE'));

    // Компрометована сесія: і поточна пара вже мертва.
    await request(app.getHttpServer())
      .post('/identity/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(401);
  });

  it('прострочений refresh → 401 REFRESH_TOKEN_INVALID', async () => {
    process.env.FADE_REFRESH_TTL_SEC = '1';
    try {
      const login = await loginMobile(ctx, '444444');
      await new Promise((r) => setTimeout(r, 1100));
      await request(app.getHttpServer())
        .post('/identity/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(401)
        .expect((res) => expect(res.body.code).toBe('REFRESH_TOKEN_INVALID'));
    } finally {
      delete process.env.FADE_REFRESH_TTL_SEC;
    }
  });
});
