// Клієнтський маршрут редагування референсу (T-043, REF-WEB-04) — саме його
// дзвінок робить UI «Моїх візитів» (POST /appointments/:id/reference).
// Адмінський маршрут покритий окремо (appointment-reference.e2e.spec.ts).
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SetAppointmentReference } from '../application/set-appointment-reference.use-case';
import { RescheduleAppointment } from '../application/reschedule-appointment.use-case';
import { ClientAppointmentsController } from './client-appointments.controller';
import { WEB_SESSION_TOKEN as TOKEN, prismaForClient } from './client-web-session.fakes';

describe('редагування референсу клієнтом (REF-WEB-04)', () => {
  let app: INestApplication;
  const handle = jest.fn();

  const build = async (owns: boolean) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClientAppointmentsController],
      providers: [
        { provide: SetAppointmentReference, useValue: { handle } },
        { provide: RescheduleAppointment, useValue: { handle: jest.fn() } },
        { provide: PrismaService, useValue: prismaForClient(owns) },
      ],
    }).compile();
    const created = moduleRef.createNestApplication();
    created.use(cookieParser());
    await created.init();
    return created;
  };

  const post = (path: string, body: object) =>
    request(app.getHttpServer()).post(path).set('Cookie', `fadoidx=${TOKEN}`).send(body);

  beforeAll(async () => {
    app = await build(true);
  });
  afterAll(async () => app.close());
  beforeEach(() => handle.mockClear());

  it('без сесії — 401 і use case не викликається', async () => {
    await request(app.getHttpServer())
      .post('/appointments/apt-1/reference')
      .send({ comment: 'х' })
      .expect(401);
    expect(handle).not.toHaveBeenCalled();
  });

  it('актор береться із сесії, actorId з тіла ігнорується', async () => {
    await post('/appointments/apt-1/reference', {
      actorId: 'attacker',
      actorRole: 'admin',
      comment: 'чубчик залишити',
    }).expect(200);
    expect(handle).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      actorId: 'user-1',
      actorRole: 'client',
      comment: 'чубчик залишити',
    });
  });

  it('referenceId не надсилається, коли поле не змінювали (undefined ≠ "")', async () => {
    await post('/appointments/apt-1/reference', { comment: 'правка' }).expect(200);
    expect(handle.mock.calls[0][0]).not.toHaveProperty('referenceId');
  });

  it('referenceId: "" проходить як прибирання значення', async () => {
    await post('/appointments/apt-1/reference', { referenceId: '', comment: '' }).expect(200);
    expect(handle).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      actorId: 'user-1',
      actorRole: 'client',
      referenceId: '',
      comment: '',
    });
  });

  it('чужий візит — 404, use case не викликається', async () => {
    const other = await build(false);
    await request(other.getHttpServer())
      .post('/appointments/apt-1/reference')
      .set('Cookie', `fadoidx=${TOKEN}`)
      .send({ comment: 'х' })
      .expect(404);
    expect(handle).not.toHaveBeenCalled();
    await other.close();
  });
});
