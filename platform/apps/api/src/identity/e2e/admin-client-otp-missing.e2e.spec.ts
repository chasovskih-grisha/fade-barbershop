// E2E T-046: клієнта не існує → verify створює User + ClientProfile «на місці»,
// тож адмін може одразу створити перший візит новому номеру (раніше — 404
// USER_NOT_FOUND «потрібен перший вхід»).
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CapturingSender, MemUsers } from './admin-client-otp.fakes';
import { CLIENT_OTP_COOKIE, createAdminClientOtpApp } from './admin-client-otp.e2e.harness';
import type { MemProfiles } from '../../crm/e2e/admin-clients.fakes';

describe('Admin client OTP (e2e, T-046) — brand-new phone', () => {
  let app: INestApplication;
  let sender: CapturingSender;
  let users: MemUsers;
  let profiles: MemProfiles;
  const cookie = CLIENT_OTP_COOKIE;

  beforeAll(async () => {
    ({ app, sender, users, profiles } = await createAdminClientOtpApp());
  });

  afterAll(async () => app.close());

  test('нового клієнта створюємо на місці: 201 + clientId, User і ClientProfile', async () => {
    const fresh = '+380501114447';
    await request(app.getHttpServer())
      .post('/admin/clients/otp/request')
      .set('Cookie', cookie)
      .send({ phone: fresh })
      .expect(201);
    const digits = sender.sent[0]?.digits ?? '';

    // prettier-ignore
    const res = await request(app.getHttpServer()).post('/admin/clients/otp/verify').set('Cookie', cookie).send({ phone: fresh, code: digits }).expect(201);
    expect(typeof res.body.clientId).toBe('string');
    expect(res.body.clientId.length).toBeGreaterThan(0);
    expect(typeof res.body.phoneVerifiedAt).toBe('string');

    // User у identity: роль client, номер верифіковано.
    const user = users.findByPhone(fresh);
    expect(user?.role).toBe('client');
    expect(user?.phoneVerifiedAt).toBeInstanceOf(Date);
    expect(user?.id).toBe(res.body.clientId);

    // ClientProfile у crm: картка привʼязана до того самого User.id.
    const profile = await profiles.findByUserId(res.body.clientId);
    expect(profile?.phone).toBe(fresh);

    // Повтор того ж коду → used → 400 (ідемпотентність через домен).
    // prettier-ignore
    await request(app.getHttpServer()).post('/admin/clients/otp/verify').set('Cookie', cookie).send({ phone: fresh, code: digits }).expect(400);
  });
});
