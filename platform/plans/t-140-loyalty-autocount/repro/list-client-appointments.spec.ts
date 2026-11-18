const start = new Date('2026-09-28T12:00:00.000Z');
const end = new Date('2026-09-28T12:45:00.000Z');

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bk-1',
    appointmentId: 'apt-1',
    barberId: 'barber-1',
    locationId: 'loc-1',
    serviceId: 'svc-1',
    agreedPrice: 700,
    status: 'booked',
    haircutReferenceId: 'photo-1',
    appointmentComment: 'коротше',
    start,
    end,
    clientId: 'user-1',
    ...overrides,
  };
}

function prismaOf(rows: ReturnType<typeof row>[]) {
  const findMany = jest.fn().mockResolvedValue(rows);
  const prisma = {
    booking: { findMany },
    service: { findMany: jest.fn().mockResolvedValue([{ id: 'svc-1', name: 'Стрижка' }]) },
    user: { findMany: jest.fn().mockResolvedValue([{ id: 'barber-1', name: 'Олег' }]) },
    location: { findMany: jest.fn().mockResolvedValue([{ id: 'loc-1', name: 'Поділ' }]) },
  };
  return { prisma, findMany };
}

describe('ListClientAppointments', () => {
  it('порожній список не чіпає довідники', async () => {
    const { prisma, findMany } = prismaOf([]);

    const views = await new ListClientAppointments(prisma as never).handle('user-1');

    expect(views).toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      where: { clientId: 'user-1' },
      orderBy: { start: 'desc' },
    });
    expect(prisma.service.findMany).not.toHaveBeenCalled();
  });

  it('мапить booked у картку кабінету з іменами', async () => {
    const { prisma } = prismaOf([row()]);
    const [view] = await new ListClientAppointments(prisma as never).handle('user-1');

    expect(view).toMatchObject({
      id: 'apt-1',
      date: '2026-09-28',
      startTime: '15:00',
      endTime: '15:45',
      serviceName: 'Стрижка',
      barberName: 'Олег',
      locationName: 'Поділ',
      price: 700,
      status: 'upcoming',
      referenceId: 'photo-1',
      referenceComment: 'коротше',
      canEditReference: true,
    });
  });

  it('статуси домену лягають у словник кабінету', async () => {
    const { prisma } = prismaOf([
      row({ status: 'confirmed', appointmentId: null }),
      row({ id: 'bk-2', status: 'completed' }),
      row({ id: 'bk-3', status: 'cancelled' }),
      row({ id: 'bk-4', status: 'no_show' }),
      row({ id: 'bk-5', status: 'in_progress' }),
    ]);
    const views = await new ListClientAppointments(prisma as never).handle('user-1');

    expect(views.map((view) => view.status)).toEqual([
      'confirmed',
      'completed',
      'cancelled',
      'cancelled',
      'confirmed',
    ]);
    expect(views[0]?.id).toBe('bk-1');
    expect(views[0]?.canEditReference).toBe(false);
    expect(views[1]?.canEditReference).toBe(false);
  });

  it('фото без референсу — null, а не порожній рядок (джерело «без референсу»)', async () => {
    const { prisma } = prismaOf([row({ haircutReferenceId: null })]);
    const [view] = await new ListClientAppointments(prisma as never).handle('user-1');

    expect(view?.referenceId).toBeNull();
  });

  it('віддає ID фото, а не URL: бакет приватний (ADR 0008 §2), REF-WEB-03', async () => {
    const { prisma } = prismaOf([row()]);
    const [view] = await new ListClientAppointments(prisma as never).handle('user-1');

    // Раніше тут стояло referenceUrl: '' — мініатюра не могла з'явитися ніколи.
    expect(view).not.toHaveProperty('referenceUrl');
    expect(view?.referenceId).toBe('photo-1');
  });
});
