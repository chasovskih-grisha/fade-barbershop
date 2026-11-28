// E2E клієнтського профілю: /identity/profile під ClientSessionGuard.
// Сценарії лише HTTP-поведінки (401/200, мапінг картки, PATCH name/preferences);
// харнес із Mem-провайдерів — у client-profile.e2e.harness.ts (не дублюємо).
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CLIENT_COOKIE, PROFILE_NOW, createClientProfileApp } from './client-profile.e2e.harness';
import { SESSION_COOKIE_NAME } from '../infrastructure/session-cookie';
import { PROFILE_1, USER_CLIENT, UUID_V7_RE } from '../application/test-ids';

describe('ClientProfileController (e2e) — /identity/profile', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createClientProfileApp());
  });

  afterAll(async () => app.close());

  const profile = () =>
    request(app.getHttpServer()).get('/identity/profile').set('Cookie', CLIENT_COOKIE);

  it('без сесії та з невідомим токеном — 401', async () => {
    await request(app.getHttpServer()).get('/identity/profile').expect(401);
    await request(app.getHttpServer())
      .get('/identity/profile')
      .set('Cookie', `${SESSION_COOKIE_NAME}=unknown-token`)
      .expect(401);
  });

  it('GET — картка гостя у форматі ClientProfileResult (ISO-дати)', async () => {
    const res = await profile();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: PROFILE_1,
      userId: USER_CLIENT,
      name: 'Олег',
      phone: '+380671111111',
      preferences: [],
      vipDiscountPercent: null,
      loyaltyVisitsCount: 2,
      birthday: null,
      // T-4725b: звичне місце — частина контракту профілю; порожнє = не обрано.
      usualChair: { locationId: null, barberId: null },
      createdAt: PROFILE_NOW.toISOString(),
      updatedAt: PROFILE_NOW.toISOString(),
    });
  });

  it('PATCH /name — оновлює імʼя і воно переживає наступний GET', async () => {
    const patched = await request(app.getHttpServer())
      .patch('/identity/profile/name')
      .set('Cookie', CLIENT_COOKIE)
      .send({ name: 'Марія' });
    expect(patched.status).toBe(200);
    expect(patched.body.name).toBe('Марія');

    expect((await profile()).body.name).toBe('Марія');
  });

  it('PATCH /preferences — масив непорожніх рядків замінює вподобання', async () => {
    const res = await request(app.getHttpServer())
      .patch('/identity/profile/preferences')
      .set('Cookie', CLIENT_COOKIE)
      .send({ preferences: ['не коротко', 'без бороди'] });
    expect(res.status).toBe(200);
    expect(
      res.body.preferences.map((p: { id: string; text: string; createdAt: string }) => p.text)
    ).toEqual(['не коротко', 'без бороди']);
    expect(res.body.preferences[0]).toEqual({
      id: expect.stringMatching(UUID_V7_RE),
      text: 'не коротко',
      createdAt: PROFILE_NOW.toISOString(),
    });

    const after = await profile();
    expect(after.body.preferences).toHaveLength(2);
    expect(after.body.name).toBe('Марія');
  });

  it('PATCH /preferences порожній масив — чистить вподобання', async () => {
    const res = await request(app.getHttpServer())
      .patch('/identity/profile/preferences')
      .set('Cookie', CLIENT_COOKIE)
      .send({ preferences: [] });
    expect(res.status).toBe(200);
    expect(res.body.preferences).toEqual([]);
    expect((await profile()).body.preferences).toEqual([]);
  });
});
