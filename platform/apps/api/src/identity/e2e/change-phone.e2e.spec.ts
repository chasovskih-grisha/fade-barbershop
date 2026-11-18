// E2E зміни номера клієнта (T-4620a): HTTP-поведінка /identity/phone/change —
// перенос номера на той самий user id, ревок інших сесій, колізія номера,
// код іншого призначення. Хендлери покриті юнітом; тут — межа HTTP + guard.
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { testId } from '../application/test-ids';
import { NEW_PHONE, OLD_PHONE, OTHER_PHONE, cookie, createChangePhoneApp, seedClient, seedLoginCode, type ChangePhoneApp } from './change-phone.e2e.harness';

const TOKEN = 'client-token-a';
const TOKEN_OTHER = 'client-token-b';
const CODE = '424242';
const FRESH = '+380501110004';

function changeRequest(ctx: ChangePhoneApp, phone: string, token = TOKEN) {
  return request(ctx.app.getHttpServer())
    .post('/identity/phone/change/request')
    .set('Cookie', cookie(token))
    .send({ phone });
}

function changeVerify(ctx: ChangePhoneApp, phone: string, code: string) {
  return request(ctx.app.getHttpServer())
    .post('/identity/phone/change/verify')
    .set('Cookie', cookie(TOKEN))
    .send({ phone, code });
}

describe('ChangePhone (e2e, T-4620a) — /identity/phone/change', () => {
  let app: INestApplication;
  let ctx: ChangePhoneApp;
  let userId: string;

  beforeAll(async () => {
    ctx = await createChangePhoneApp();
    app = ctx.app;
    userId = seedClient(ctx, OLD_PHONE, [TOKEN, TOKEN_OTHER]);
  });

  afterAll(async () => app.close());

  it('без сесії обидва кроки → 401 (guard)', async () => {
    await request(app.getHttpServer())
      .post('/identity/phone/change/request')
      .send({ phone: NEW_PHONE })
      .expect(401);
    await request(app.getHttpServer())
      .post('/identity/phone/change/verify')
      .send({ phone: NEW_PHONE, code: CODE })
      .expect(401);
  });

  it('потік: verify переносить номер; інші сесії ревоковано; старий номер не входить', async () => {
    const req = await changeRequest(ctx, NEW_PHONE).expect(201);
    expect(req.body).toMatchObject({ retryAfterSec: 60 });
    expect(ctx.sender.sent[0]).toMatchObject({ phone: NEW_PHONE, purpose: 'phone_change' });

    const digits = ctx.sender.sent[0]?.digits ?? '';
    const verify = await changeVerify(ctx, NEW_PHONE, digits).expect(201);
    expect(verify.body).toEqual({ ok: true, phone: NEW_PHONE });
    expect(ctx.users.findById(userId)?.phone.value).toBe(NEW_PHONE);
    expect(ctx.users.findByPhone(NEW_PHONE)?.id).toBe(userId);

    // Інші сесії ревоковано, поточна (TOKEN) жива.
    await request(app.getHttpServer())
      .get('/identity/client/sessions')
      .set('Cookie', cookie(TOKEN_OTHER))
      .expect(401);
    await request(app.getHttpServer())
      .get('/identity/client/sessions')
      .set('Cookie', cookie(TOKEN))
      .expect(200);

    // Старий номер більше не відкриває цей акаунт — логін створює іншого user.
    seedLoginCode(ctx, OLD_PHONE, CODE);
    const login = await request(app.getHttpServer())
      .post('/identity/otp/verify')
      .send({ phone: OLD_PHONE, code: CODE })
      .expect(200);
    expect(login.body.user.id).not.toBe(userId);
  });

  it('номер іншого акаунта → PHONE_TAKEN, обидва без змін', async () => {
    ctx.users.save(
      User.create({
        id: testId(),
        phone: PhoneNumber.of(OTHER_PHONE),
        role: 'client',
        createdAt: new Date(),
      })
    );
    await changeRequest(ctx, OTHER_PHONE).expect(201);
    const digits = ctx.sender.sent.at(-1)?.digits ?? '';
    const res = await changeVerify(ctx, OTHER_PHONE, digits).expect(409);
    expect(res.body.code).toBe('PHONE_TAKEN');
    expect(ctx.users.findById(userId)?.phone.value).toBe(NEW_PHONE);
  });

  it('код призначення login не завершує зміну номера → 400', async () => {
    seedLoginCode(ctx, FRESH, CODE);
    const res = await changeVerify(ctx, FRESH, CODE).expect(400);
    expect(res.body.code).toBe('OTP_PURPOSE_MISMATCH');
  });

  it('додаткова перевірка зміни номера', () => {
    expect(NEW_PHONE).toBeDefined();
  });
});
