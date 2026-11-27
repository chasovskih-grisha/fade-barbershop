// T-4616b: крок «не вийду» в застосунку барбера. Раніше маршрут
// `POST /barber/schedule/:locationId/unavailability` існував, але жоден тест
// його не викликав — ні право `selfSchedule`, ні прив'язка до локації, ні
// мапінг помилок не були доведені.
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { InvalidUnavailabilityError } from '../domain/barber-unavailability';
import { BarberScheduleController } from './barber-schedule.controller';

const request = { clientSession: { userId: 'barber-1', sessionId: 's-1' } } as unknown as Request;
const DAY = { start: '2026-12-01T00:00:00.000Z', end: '2026-12-02T00:00:00.000Z' };

function setup({ canEdit = true, assigned = true, error }: { canEdit?: boolean; assigned?: boolean; error?: Error } = {}) {
  const markUnavailable = {
    execute: jest.fn(async () => {
      if (error) throw error;
      return { unavailability: { id: 'un-1' }, conflictsCreated: 2 };
    }),
  };
  const prisma = {
    staffAssignment: {
      findUnique: jest.fn(async () => (assigned ? { id: 'assignment-1' } : null)),
      findMany: jest.fn(async () => [{ locationId: 'location-1' }, { locationId: 'location-2' }]),
    },
    location: {
      findMany: jest.fn(async () => [
        { id: 'location-1', name: 'FADE Central' },
        { id: 'location-2', name: 'FADE Podil' },
      ]),
    },
  };
  const policies = { findForBarber: jest.fn(async () => ({ selfService: canEdit, allowOutsideHours: false })) };
  const controller = new BarberScheduleController(
    { handle: jest.fn() } as never,
    { listByBarberAndLocation: jest.fn() } as never,
    policies as never,
    { listByBarber: jest.fn(async () => []) } as never,
    markUnavailable as never,
    prisma as never
  );
  return { controller, markUnavailable, prisma };
}

describe('BarberScheduleController (T-4616b)', () => {
  it('віддає локації самого барбера, а не всю мережу', async () => {
    const { controller, prisma } = setup();

    const result = await controller.locations(request);

    expect(prisma.staffAssignment.findMany).toHaveBeenCalledWith({
      where: { barberId: 'barber-1' },
      select: { locationId: true },
    });
    expect(result.locations.map((location) => location.id)).toEqual(['location-1', 'location-2']);
  });

  it('позначає день недоступним від імені сесії і повертає кількість конфліктів', async () => {
    const { controller, markUnavailable } = setup();

    const result = await controller.unavailability('location-1', { ...DAY, reason: 'sick' }, request);

    expect(markUnavailable.execute).toHaveBeenCalledWith({
      barberId: 'barber-1',
      locationId: 'location-1',
      ...DAY,
      reason: 'sick',
      actorId: 'barber-1',
    });
    expect(result).toEqual({ unavailability: { id: 'un-1' }, conflictsCreated: 2 });
  });

  it('не дає позначити без делегованого права', async () => {
    const { controller, markUnavailable } = setup({ canEdit: false });

    await expect(controller.unavailability('location-1', DAY, request)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(markUnavailable.execute).not.toHaveBeenCalled();
  });

  it('не дає позначити в чужій локації', async () => {
    const { controller, markUnavailable } = setup({ assigned: false });

    await expect(controller.unavailability('location-2', DAY, request)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(markUnavailable.execute).not.toHaveBeenCalled();
  });

  it('порожній інтервал — 400, а не збережена недоступність', async () => {
    const { controller } = setup({ error: new InvalidUnavailabilityError('end must be after start') });

    await expect(controller.unavailability('location-1', DAY, request)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });
});
