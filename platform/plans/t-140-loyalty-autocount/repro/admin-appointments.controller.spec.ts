import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { AppointmentLifecycle } from '../application/appointment-lifecycle.use-case';
import { RescheduleAppointment } from '../application/reschedule-appointment.use-case';
import { SetAppointmentReference } from '../application/set-appointment-reference.use-case';
import { AdminAppointmentsController } from './admin-appointments.controller';

function session(userId: string | null) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (userId) (req as Request & { adminUserId?: string }).adminUserId = userId;
    next();
  };
}

describe('адмінські команди візиту', () => {
  let app: INestApplication;
  const confirm = jest.fn();
  const cancel = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminAppointmentsController],
      providers: [
        {
          provide: AppointmentLifecycle,
          useValue: {
            confirm,
            cancel,
            start: jest.fn(),
            complete: jest.fn(),
            markNoShow: jest.fn(),
          },
        },
        { provide: RescheduleAppointment, useValue: { handle: jest.fn() } },
        { provide: SetAppointmentReference, useValue: { handle: jest.fn() } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(session('admin-1'));
    await app.init();
  });

  afterAll(async () => app.close());

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
  const confirm = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminAppointmentsController],
      providers: [
        { provide: AppointmentLifecycle, useValue: { confirm } },
        { provide: RescheduleAppointment, useValue: { handle: jest.fn() } },
        { provide: SetAppointmentReference, useValue: { handle: jest.fn() } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(session(null));
    await app.init();
  });

  afterAll(async () => app.close());

  it('не виконує команду', async () => {
    await request(app.getHttpServer())
      .post('/admin/appointments/apt-1/confirm')
      .send({})
      .expect(401);

    expect(confirm).not.toHaveBeenCalled();
  });
});
