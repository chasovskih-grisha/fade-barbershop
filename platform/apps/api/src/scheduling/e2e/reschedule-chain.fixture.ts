// Фікстури e2e ланцюга перенесення (T-4533): унікальні клієнт і токен на
// прогін, запити візиту, подія rescheduled і повторна доставка споживачем.
// Окремо від *.spec.ts — LOC-гейт; спека лишається тонким описом поведінки.
import { uuidv7 } from '@fade/domain-shared';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import type { Prisma } from '@prisma/client';
import { postWithRetry } from '@fade/test-utils';
import { AppointmentActivityProjection } from '../infrastructure/appointment-activity.projection';
import type { LifecycleSuite } from './appointment-lifecycle.suite';
import { dropWebClient, seedWebClient } from './web-client.fixture';

export const NEW_DATE = '2026-11-16'; // Інший понеділок — графік барбера лише на day 0.

// Токен унікальний на прогін: Session.tokenHash — @unique, тож фіксований рядок
// ламає будь-який паралельний прогін (другий insert → P2002, а guard дістає
// сесію чужого користувача → 401 замість очікуваного 200).
export const newWebToken = (): string => `web-reschedule-token-${uuidv7()}`;
export const newClientId = (): string => uuidv7();

export const rowOf = (ctx: LifecycleSuite, id: string) =>
  ctx.prisma.booking.findUnique({ where: { id } });

/** Перенесення візиту клієнтом із повтором за контрактом (очікує 200). */
export const moveBooking =
  (
    ctx: LifecycleSuite,
    token: string
  ): ((id: string, body: object) => Promise<SupertestResponse>) =>
  (id: string, body: object) =>
    postWithRetry(
      (b: object) =>
        request(ctx.app.getHttpServer())
          .post(`/appointments/${id}/reschedule`)
          .set('Cookie', `fadoidx=${token}`)
          .send(b),
      body,
      { expectStatus: HttpStatus.OK }
    );

/** Події rescheduled візиту в порядку створення. */
export const rescheduledEvents = (ctx: LifecycleSuite, bookingId: string) =>
  ctx.prisma.outboxMessage.findMany({
    where: { aggregateId: bookingId, type: 'scheduling.appointment.rescheduled' },
    orderBy: { createdAt: 'asc' },
  });

/** Доставка події споживачем-еталоном: щоразу новий виклик (для duplicate-тесту). */
export const deliverActivity =
  (
    ctx: LifecycleSuite,
    event: { id: string; type: string; aggregateId: string; payload: Prisma.JsonValue }
  ) =>
  () => {
    const projection = new AppointmentActivityProjection(ctx.prisma);
    return ctx.prisma.$transaction((tx: Prisma.TransactionClient) =>
      projection.handleOne(
        { id: event.id, type: event.type, aggregateId: event.aggregateId, payload: event.payload },
        tx
      )
    );
  };

/** Негативні маршрути клієнта: без дати → 400, неіснуючий → 404, без сесії → 401. */
export async function expectClientRouteErrors(
  ctx: LifecycleSuite,
  bookingId: string,
  token: string
): Promise<void> {
  const server = ctx.app.getHttpServer();
  // prettier-ignore
  await request(server).post(`/appointments/${bookingId}/reschedule`).set('Cookie', `fadoidx=${token}`).send({ start: '12:00', end: '12:30' }).expect(HttpStatus.BAD_REQUEST);
  // prettier-ignore
  await request(server).post('/appointments/00000000-0000-4000-8000-000000000000/reschedule').set('Cookie', `fadoidx=${token}`).send({ date: NEW_DATE, start: '12:00', end: '12:30' }).expect(HttpStatus.NOT_FOUND);
  // prettier-ignore
  await request(server).post(`/appointments/${bookingId}/reschedule`).send({ date: NEW_DATE, start: '12:00', end: '12:30' }).expect(HttpStatus.UNAUTHORIZED);
}

export { dropWebClient, seedWebClient };
