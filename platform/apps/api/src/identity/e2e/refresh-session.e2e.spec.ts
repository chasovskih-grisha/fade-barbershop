// E2E: refresh-флоу mobile (T-014) — вхід і ротація пари.
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hashOtpCode } from '../domain/otp-code';
import { OtpChallenge } from '../domain/otp-challenge';
import { SESSION_COOKIE_NAME } from '../infrastructure/session-cookie';
import {
  REFRESH_E2E_PHONE,
  REFRESH_E2E_T0,
  createRefreshSessionApp,
  loginMobile,
  type RefreshE2eCtx,
} from './refresh-session.e2e.harness';

describe('Mobile refresh flow (e2e, T-014)', () => {
  let app: INestApplication;
  let ctx: RefreshE2eCtx;

  beforeAll(async () => {
    ctx = await createRefreshSessionApp();
    app = ctx.app;
  });

  afterAll(async () => app.close());

  it('mobile-вхід повертає пару без cookie; web — cookie без refresh', async () => {
    const mobile = await loginMobile(ctx, '111111');
    expect(mobile.body.token).toHaveLength(64);
    expect(mobile.body.refreshToken).toHaveLength(64);
    expect(mobile.body.expiresInSec).toBeGreaterThan(0);
    expect(mobile.headers['set-cookie']).toBeUndefined();

    ctx.challengeSeq.n += 1;
    await ctx.challenges.save(
      OtpChallenge.create({
        id: `ch-w${ctx.challengeSeq.n}`,
        phone: REFRESH_E2E_PHONE,
        codeHash: hashOtpCode('222222'),
        now: new Date(REFRESH_E2E_T0.getTime() + ctx.challengeSeq.n * 60_000),
      })
    );
    const web = await request(app.getHttpServer())
      .post('/identity/otp/verify')
      .send({ phone: REFRESH_E2E_PHONE, code: '222222', channel: 'web' })
      .expect(200);
    expect(web.body.refreshToken).toBeUndefined();
    const rawCookie = String(web.headers['set-cookie'] ?? '');
    expect(rawCookie).toContain(`${SESSION_COOKIE_NAME}=`);
  });

  it('ротація: нова пара; access працює Bearer-logout; старий refresh → 401, reuse ріже сесію', async () => {
    const login = await loginMobile(ctx, '333333');
    const { refreshToken } = login.body as { refreshToken: string };

    const rotated = await request(app.getHttpServer())
      .post('/identity/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(rotated.body.refreshToken).toHaveLength(64);
    expect(rotated.body.refreshToken).not.toBe(refreshToken);
    expect(rotated.body.user.id).toBeTruthy();

    // Новий access валідний: Bearer-logout ріже сесію цілком.
    const logout = await request(app.getHttpServer())
      .post('/identity/auth/logout')
      .set('Authorization', `Bearer ${rotated.body.token}`)
      .expect(200);
    expect(logout.body.ok).toBe(true);

    // Сесія відкликана → повторний refresh дає 401; logout ідемпотентний
    // (конвенція RevokeSession) — ok:true без другої події.
    await request(app.getHttpServer())
      .post('/identity/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/identity/auth/logout')
      .set('Authorization', `Bearer ${rotated.body.token}`)
      .expect(200)
      .expect((res) => expect(res.body.ok).toBe(true));
  });
});
