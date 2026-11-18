// Адмінські команди візиту (T-043): актор завжди береться із сесії, а не з
// тіла запиту (спроба підмінити actorId/actorRole ігнорується). Без сесії —
// 401 і use case не викликається. Збірка — admin-appointments.controller.fakes.ts.
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { makeAdminAppointmentsApp } from './admin-appointments.controller.fakes';

describe('адмінські команди візиту', () => {
  let app: INestApplication;
  let confirm: jest.Mock;
  let cancel: jest.Mock;

  beforeAll(async () => {
    ({ app, confirm, cancel } = await makeAdminAppointmentsApp('admin-1'));
  });
  afterAll(() => app.close());
  beforeEach(() => {
    confirm.mockClear();
    cancel.mockClear();
  });

  it('бере актора з сесії і ігнорує тіло', async () => {
    await request(app.getHttpServer())
      .post('/admin/appointments/apt-1/confirm')
      .send({ actorId: 'attacker', actorRole: 'barber' })
      .expect(200);

    expect(confirm).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      actorId: 'admin-1',
      actorRole: 'admin',
    });
  });

  it('скасування з роллю барбера в тілі лишається адмінським', async () => {
    await request(app.getHttpServer())
      .post('/admin/appointments/apt-1/cancel')
      .send({ actorId: 'barber-9', actorRole: 'barber', reason: 'не прийде' })
      .expect(200);

    expect(cancel).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      actorId: 'admin-1',
      actorRole: 'admin',
      reason: 'не прийде',
    });
  });
});

describe('без адмін-сесії', () => {
  let app: INestApplication;
  let confirm: jest.Mock;

  beforeAll(async () => {
    ({ app, confirm } = await makeAdminAppointmentsApp(null));
  });
  afterAll(() => app.close());

  it('не виконує команду', async () => {
    await request(app.getHttpServer())
      .post('/admin/appointments/apt-1/confirm')
      .send({})
      .expect(401);

    expect(confirm).not.toHaveBeenCalled();
  });
});
