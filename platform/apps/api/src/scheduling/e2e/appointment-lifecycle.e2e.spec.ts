// E2E життєвого циклу Appointment (T-042): бронювання через /admin/bookings,
// далі confirm → start → complete через /admin/appointments/:id/*. Перевіряємо
// статуси на Booking-рядку і події в OutboxMessage (типи за README).
// Фікстури — у appointment-lifecycle.fixtures (ADR 0019, LOC).

import { Test } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { SchedulingModule } from '../scheduling.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  buildLifecycleIds,
  cleanupLifecycle,
  book,
  command,
  seedLifecycle,
  stampAdmin,
} from './appointment-lifecycle.fixtures';

describe('AppointmentLifecycle (e2e, Postgres)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const ids = buildLifecycleIds();
  let appointmentId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [SchedulingModule] }).compile();
    app = moduleRef.createNestApplication();
    stampAdmin(app);
    await app.init();
    prisma = app.get(PrismaService);
    await seedLifecycle(prisma, ids);
  });

  afterAll(async () => {
    await cleanupLifecycle(prisma, ids);
    await app.close();
  });

  const admin = { actorId: 'admin-1', actorRole: 'admin' };
  const barber = { actorId: 'barber', actorRole: 'barber' };

  test('book → confirm → start → complete: статуси і події в outbox', async () => {
    const booking = await book(app, ids, { start: '10:00', end: '10:30' });
    const bookingId = booking.body.id as string;
    expect([HttpStatus.OK, HttpStatus.CREATED]).toContain(
      (await command({ app, id: bookingId, action: 'confirm', dto: admin })).status
    );
    expect((await command({ app, id: bookingId, action: 'start', dto: barber })).status).toBe(
      HttpStatus.OK
    );
    expect((await command({ app, id: bookingId, action: 'complete', dto: barber })).status).toBe(
      HttpStatus.OK
    );

    const row = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(row?.status).toBe('completed');
    appointmentId = row?.appointmentId ?? '';

    const events = await prisma.outboxMessage.findMany({
      where: { aggregateType: 'appointment', aggregateId: appointmentId },
      orderBy: { createdAt: 'asc' },
    });
    expect(events.map((event) => event.type)).toEqual([
      'scheduling.appointment.booked',
      'scheduling.appointment.confirmed',
      'scheduling.appointment.started',
      'scheduling.appointment.completed',
    ]);
  });
  test('статуси не відкочуються: complete після completed → 409', async () => {
    expect(
      (await command({ app, id: appointmentId, action: 'complete', dto: barber })).status
    ).toBe(HttpStatus.CONFLICT);
  });

  test('роль барбера в тілі ігнорується: скасовує адмін із сесії', async () => {
    const booking = await book(app, ids, { start: '12:00', end: '12:30' });
    expect(
      (await command({ app, id: booking.body.id, action: 'cancel', dto: barber })).status
    ).toBe(HttpStatus.OK);
    const row = await prisma.booking.findUnique({ where: { id: booking.body.id as string } });
    expect(row?.status).toBe('cancelled');
  });
});
