import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppointmentLifecycle } from '../application/appointment-lifecycle.use-case';
import { RescheduleAppointment } from '../application/reschedule-appointment.use-case';
import { SetAppointmentReference } from '../application/set-appointment-reference.use-case';
import { ClientAppointmentsController } from './client-appointments.controller';
import { ClientCancelController } from './client-cancel.controller';
import { WEB_SESSION_TOKEN as TOKEN, prismaForClient } from './client-web-session.fakes';

describe('клієнтські команди візиту', () => {
  let app: INestApplication;
  const cancel = jest.fn();
  const handle = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClientCancelController, ClientAppointmentsController],
      providers: [
        { provide: AppointmentLifecycle, useValue: { cancel } },
        { provide: RescheduleAppointment, useValue: { handle } },
        { provide: SetAppointmentReference, useValue: { handle: jest.fn() } },
        { provide: PrismaService, useValue: prismaForClient(true) },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => app.close());

  it('скасування без сесії — 401 і не чіпає візит', async () => {
    await request(app.getHttpServer()).post('/appointments/apt-1/cancel').expect(401);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('скасування свого візиту бере актора з сесії', async () => {
    await request(app.getHttpServer())
      .post('/appointments/apt-1/cancel')
      .set('Cookie', `fadoidx=${TOKEN}`)
      .expect(200);
    expect(cancel).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      actorId: 'user-1',
      actorRole: 'client',
    });
  });

  it('перенесення без кінця слота — 400', async () => {
    await request(app.getHttpServer())
      .post('/appointments/apt-1/reschedule')
      .set('Cookie', `fadoidx=${TOKEN}`)
      .send({ date: '2026-10-02', start: '11:00' })
      .expect(400);
    expect(handle).not.toHaveBeenCalled();
  });

  it('перенесення ігнорує actorId з тіла', async () => {
    await request(app.getHttpServer())
      .post('/appointments/apt-1/reschedule')
      .set('Cookie', `fadoidx=${TOKEN}`)
      .send({ actorId: 'attacker', date: '2026-10-02', start: '11:00', end: '11:45' })
      .expect(200);
    expect(handle).toHaveBeenCalledWith({
      appointmentId: 'apt-1',
      actorId: 'user-1',
      actorRole: 'client',
      date: '2026-10-02',
      start: '11:00',
      end: '11:45',
    });
  });
});
