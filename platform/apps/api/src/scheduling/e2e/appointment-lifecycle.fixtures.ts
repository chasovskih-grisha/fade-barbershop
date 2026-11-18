// Фікстури lifecycle e2e (T-042): сід локації з одним кріслом, барбер-тріо
// і хелпери бронювання/команд. Спільні фікстури — @fade/test-utils (ADR 0019);
// сюїтові лишаються лише HTTP-хелпери конкретних маршрутів.
import { uuidv7 } from '@fade/domain-shared';
import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import {
  assignBarber,
  cleanupTestLocation,
  postWithRetry,
  seedBarberUser,
  seedTestLocation,
} from '@fade/test-utils';
import type { PrismaService } from '../../shared/prisma/prisma.service';

export const DATE = '2026-11-09'; // Понеділок.

const uid = () => uuidv7();

export interface LifecycleIds {
  location: string;
  chair1: string;
  barber1: string;
}

export function buildLifecycleIds(): LifecycleIds {
  return { location: uid(), chair1: uid(), barber1: uid() };
}

export async function seedLifecycle(prisma: PrismaService, ids: LifecycleIds): Promise<void> {
  await seedTestLocation(prisma, {
    id: ids.location,
    codePrefix: 'LC',
    name: 'Lifecycle test',
    chairs: 1,
  });
  await seedBarberUser(prisma, { id: ids.barber1, name: 'LC Barber' });
  await assignBarber(prisma, {
    locationId: ids.location,
    barberId: ids.barber1,
    dayOfWeek: 0,
    window: { start: '08:00', end: '18:00' },
  });
}

export async function cleanupLifecycle(prisma: PrismaService, ids: LifecycleIds): Promise<void> {
  // FK-впорядкований cleanup піддерева (вкл. outbox за власними booking-ID).
  await cleanupTestLocation(prisma, { id: ids.location }, [ids.barber1]);
}

/** POST /admin/bookings — створити запис (джерело агрегата Appointment);
 *  payload несе старт/кінець і опційні снепшоти (reference/origin — T-043/T-046). */
export async function book(
  app: INestApplication,
  ids: LifecycleIds,
  payload: { start: string; end: string; reference?: object; origin?: object }
): Promise<request.Response> {
  const body = {
    barberId: ids.barber1,
    locationId: ids.location,
    date: DATE,
    ...payload,
    serviceDuration: 30,
  };
  // 409 (P2034 Serializable) і 500 (насичення пулу) — транзитні: повтор
  // за контрактом клієнта в спільному хелпері @fade/test-utils.
  return postWithRetry((b: object) => request(app.getHttpServer()).post('/admin/bookings').send(b), body);
}

/** Сесія адміна для e2e без IdentityModule: guard у проді кладе той самий adminUserId. */
export function stampAdmin(app: INestApplication, userId = 'admin-1'): void {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { adminUserId?: string }).adminUserId = userId;
    next();
  });
}

/** POST /admin/appointments/:id/:action — команда життєвого циклу. */
export function command(input: { app: INestApplication; id: string; action: string; dto: object }) {
  return request(input.app.getHttpServer())
    .post(`/admin/appointments/${input.id}/${input.action}`)
    .send(input.dto);
}
