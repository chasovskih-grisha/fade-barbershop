// Збірка AdminAppointmentsController для спек (T-043): модуль із підміненими
// use cases і middleware-сесією адміна (userId null → сесії немає → 401).
// Окремо від *.spec.ts — LOC-гейт і спільний setup обох describe.
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
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

export interface AdminAppointmentsEnv {
  app: INestApplication;
  confirm: jest.Mock;
  cancel: jest.Mock;
}

/** Контролер у модулі: userId — актор у сесії, null — запит без сесії. */
export async function makeAdminAppointmentsApp(
  userId: string | null
): Promise<AdminAppointmentsEnv> {
  const confirm = jest.fn();
  const cancel = jest.fn();
  const moduleRef = await Test.createTestingModule({
    controllers: [AdminAppointmentsController],
    providers: [
      {
        provide: AppointmentLifecycle,
        useValue: { confirm, cancel, start: jest.fn(), complete: jest.fn(), markNoShow: jest.fn() },
      },
      { provide: RescheduleAppointment, useValue: { handle: jest.fn() } },
      { provide: SetAppointmentReference, useValue: { handle: jest.fn() } },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.use(session(userId));
  await app.init();
  return { app, confirm, cancel };
}
