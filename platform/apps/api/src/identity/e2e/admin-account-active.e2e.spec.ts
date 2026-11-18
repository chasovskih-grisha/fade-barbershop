// E2E T-4411: блокування адміна + журнал входів.
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PhoneNumber } from '../domain/phone-number';
import { User } from '../domain/user';
import { MemUsers } from './admin-client-otp.fakes';
import {
  ACCOUNT_NOW,
  createAdminAccountApp,
  loginAs,
  seedAdmin,
} from './admin-account.e2e.harness';
import { uuidv7 } from '@fade/domain-shared';

const CLIENT_ID = uuidv7();

describe('Admin account lifecycle (e2e, T-4411) — active & audit', () => {
  let app: INestApplication;
  let users: MemUsers;

  beforeAll(async () => {
    ({ app, users } = await createAdminAccountApp());
  });

  afterAll(async () => app.close());

  it('блокування: сесії закриті, вхід заборонений; розблокування повертає доступ', async () => {
    seedAdmin(users, 'chief', 'ChiefPass123');
    seedAdmin(users, 'staff', 'StaffPass123');
    const staffCookie = await loginAs(app, 'staff', 'StaffPass123');
    const chiefCookie = await loginAs(app, 'chief', 'ChiefPass123');

    const block = await request(app.getHttpServer())
      .post('/admin/admins/staff/active')
      .set('Cookie', chiefCookie)
      .send({ active: false })
      .expect(201);
    expect(block.body).toEqual({ active: false, closedSessions: 1 });
    await request(app.getHttpServer()).get('/admin/auth/me').set('Cookie', staffCookie).expect(401);
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ username: 'staff', password: 'StaffPass123' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/admin/admins/staff/active')
      .set('Cookie', chiefCookie)
      .send({ active: true })
      .expect(201);
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ username: 'staff', password: 'StaffPass123' })
      .expect(200);
  });

  it('журнал входів: без сесії → 401 (guard); не-адмін ціль скидання → 403', async () => {
    seedAdmin(users, 'walker', 'WalkerPass123');
    users.store.set(
      CLIENT_ID,
      User.create({
        id: CLIENT_ID,
        phone: PhoneNumber.of('+380509999999'),
        role: 'client',
        name: null,
        active: true,
        selfSchedule: false,
        username: null,
        passwordHash: null,
        createdAt: ACCOUNT_NOW,
      })
    );
    const cookie = await loginAs(app, 'walker', 'WalkerPass123');
    await request(app.getHttpServer())
      .get('/admin/admins/walker/logins')
      .set('Cookie', cookie)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/admin/admins/${CLIENT_ID}/password`)
      .set('Cookie', cookie)
      .expect(403);
    await request(app.getHttpServer()).post(`/admin/admins/${CLIENT_ID}/password`).expect(401);
  });
});
