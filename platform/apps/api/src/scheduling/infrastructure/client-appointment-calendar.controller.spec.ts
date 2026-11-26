import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ClientAppointmentCalendarController } from './client-appointment-calendar.controller';

const OWNED = {
  id: 'booking-1',
  appointmentId: 'appointment-1',
  clientId: 'client-1',
  start: new Date('2026-07-15T09:00:00Z'),
  end: new Date('2026-07-15T10:00:00Z'),
  barberId: 'barber-1',
  locationId: 'location-1',
  agreedPrice: 600,
  finalPrice: 600,
  appliedDiscounts: [],
  haircutReferenceId: null,
  status: 'booked',
  version: 0,
};

type Row = typeof OWNED;
interface Where {
  clientId: string;
  OR: Array<{ appointmentId?: string; id?: string }>;
}

function setup(rows: Row[] = [OWNED], session: { userId: string } | null = { userId: 'client-1' }) {
  const prisma = {
    session: {
      findUnique: jest.fn(async () => session && { ...session, channel: 'web', revokedAt: null }),
    },
    booking: {
      findFirst: jest.fn(async ({ where }: { where: Where }) => {
        const wanted = where.OR.flatMap((branch) => [branch.appointmentId, branch.id]);
        return (
          rows.find(
            (row) =>
              row.clientId === where.clientId &&
              (wanted.includes(row.id) || wanted.includes(row.appointmentId))
          ) ?? null
        );
      }),
    },
    location: {
      findUnique: jest.fn(async () => ({ name: 'FADE Сіті', address: 'вул. Хрещатик, 1' })),
    },
  };
  return { prisma, controller: new ClientAppointmentCalendarController(prisma as never) };
}

function response() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: string) {
      this.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
  };
}

const request = (token?: string) =>
  ({ cookies: token ? { fadoidx: token } : {} }) as unknown as Request;

describe('ClientAppointmentCalendarController (T-4446a)', () => {
  it('refuses a request without a client session', async () => {
    const { prisma, controller } = setup([OWNED], null);

    await expect(
      controller.exportIcs('appointment-1', request(), response() as unknown as Response)
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.booking.findFirst).not.toHaveBeenCalled();
  });

  it("answers 404 for another client's appointment", async () => {
    const { controller } = setup([{ ...OWNED, clientId: 'client-2' }]);
    const res = response();

    await controller.exportIcs('appointment-1', request('token'), res as unknown as Response);

    expect(res.statusCode).toBe(404);
    expect(res.body).toBe('Booking not found');
    expect(res.headers['Content-Type']).toBeUndefined();
  });

  it('streams the booking as a downloadable calendar file', async () => {
    const { prisma, controller } = setup();
    const res = response();

    await controller.exportIcs('appointment-1', request('token'), res as unknown as Response);

    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clientId: 'client-1' }) })
    );
    expect(res.headers['Content-Type']).toBe('text/calendar; charset=utf-8');
    expect(res.headers['Content-Disposition']).toBe('attachment; filename="fade-booking-1.ics"');
    expect(res.headers['Cache-Control']).toBe('private, no-store');
    expect(res.body).toContain('BEGIN:VCALENDAR');
    expect(res.body).toContain('DTSTART:20260715T090000Z');
    expect(res.body).toContain('UID:fade-booking-booking-1@fade.barber');
  });
});
