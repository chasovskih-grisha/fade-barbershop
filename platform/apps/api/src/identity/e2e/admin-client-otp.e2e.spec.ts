// E2E T-4409: адмін ініціює OTP клієнта і верифікує код (happy-path + guard).
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { CapturingSender, MemUsers } from './admin-client-otp.fakes';
import {
  CLIENT_ID,
  CLIENT_OTP_COOKIE,
  CLIENT_OTP_NOW,
  CLIENT_OTP_PHONE,
  createAdminClientOtpApp,
} from './admin-client-otp.e2e.harness';

describe('Admin client OTP (e2e, T-4409)', () => {
  let app: INestApplication;
  let users: MemUsers;
  let sender: CapturingSender;
  const cookie = CLIENT_OTP_COOKIE;
  const phone = CLIENT_OTP_PHONE;

  beforeAll(async () => {
    ({ app, users, sender } = await createAdminClientOtpApp());
  });

  afterAll(async () => app.close());

  test('без сесії → 401 (guard)', async () => {
    await request(app.getHttpServer())
      .post('/admin/clients/otp/request')
      .send({ phone })
      .expect(401);
  });

  test('повний потік: ініціація → 201 retryAfterSec; верифікація коду з каналу → phoneVerifiedAt', async () => {
    users.save(
      User.create({
        id: CLIENT_ID,
        phone: PhoneNumber.of(phone),
        role: 'client',
        createdAt: CLIENT_OTP_NOW,
      })
    );

    const req = await request(app.getHttpServer())
      .post('/admin/clients/otp/request')
      .set('Cookie', cookie)
      .send({ phone })
      .expect(201);
    expect(req.body).toMatchObject({ retryAfterSec: 60 });
    expect(sender.sent[0]).toMatchObject({ phone, purpose: 'booking' });

    // Код — з каналу (те, що клієнт прочитав би адміну): єдине місце plaintext.
    const digits = sender.sent[0]?.digits ?? '';
    // prettier-ignore
    const verify = await request(app.getHttpServer()).post('/admin/clients/otp/verify').set('Cookie', cookie).send({ phone, code: digits }).expect(201);
    // Реальний SystemClock модуля — перевіряємо лише факт фіксації дати.
    expect(typeof verify.body.phoneVerifiedAt).toBe('string');
    // T-046: verify віддає id клієнта для origin.clientId наступного візиту.
    expect(verify.body.clientId).toBe(CLIENT_ID);
    expect(users.store.get(CLIENT_ID)?.phoneVerifiedAt).toBeInstanceOf(Date);

    // Повтор того ж коду → used → 400 (ідемпотентність через домен).
    // prettier-ignore
    await request(app.getHttpServer()).post('/admin/clients/otp/verify').set('Cookie', cookie).send({ phone, code: digits }).expect(400);
  });
});
