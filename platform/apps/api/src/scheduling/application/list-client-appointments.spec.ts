/* eslint-disable max-lines -- одна матриця контракту кабінету; фікстури винесені в .fakes */
// ListClientAppointments (T-041): мапер рядків booking у картки кабінету —
// словник статусів, імена довідників, ID фото (не URL: бакет приватний).
// Порожній список не чіпає довідники. Фікстури — list-client-appointments.fakes.ts.
import { ListClientAppointments } from './list-client-appointments';
import { bookingRow, prismaOf } from './list-client-appointments.fakes';

const handle = (rows: ReturnType<typeof bookingRow>[]) =>
  new ListClientAppointments(prismaOf(rows).prisma as never).handle('user-1');

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
    expect(prisma.depositHold.findMany).not.toHaveBeenCalled();
  });

  it('мапить booked у картку кабінету з іменами і джерелом (PAY-ONS-01)', async () => {
    const [view] = await handle([bookingRow({ source: 'walk_in' })]);
    const legacy = await handle([bookingRow({ source: null })]);

    expect(legacy[0]?.source).toBe('web');
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
      source: 'walk_in',
      referenceId: 'photo-1',
      referenceComment: 'коротше',
      canEditReference: true,
      deposit: { amount: 210, freeCancelUntil: '2026-09-28T08:00:00.000Z' },
    });
  });

  it('дедлайн скасування рахується від поточного початку візиту', async () => {
    const moved = new Date('2026-10-01T09:30:00.000Z');
    const [view] = await handle([bookingRow({ start: moved })]);

    expect(view?.deposit).toEqual({
      amount: 210,
      freeCancelUntil: '2026-10-01T05:30:00.000Z',
    });
  });

  it('візит без депозиту — null, а не нульова сума', async () => {
    const [view] = await handle([
      bookingRow({ depositAmount: null, depositPercent: null, cancellationWindowHours: null }),
    ]);

    expect(view?.deposit).toBeNull();
  });

  it('нульова сума або невідоме вікно не називаються умовами', async () => {
    const zero = await handle([bookingRow({ depositAmount: 0 })]);
    const noWindow = await handle([bookingRow({ cancellationWindowHours: null })]);

    expect(zero[0]?.deposit).toBeNull();
    expect(noWindow[0]?.deposit).toBeNull();
  });

  it('статуси домену лягають у словник кабінету', async () => {
    const rows = [
      bookingRow({ status: 'confirmed', appointmentId: null }),
      bookingRow({ id: 'bk-2', status: 'completed' }),
      bookingRow({ id: 'bk-3', status: 'cancelled' }),
      bookingRow({ id: 'bk-4', status: 'no_show' }),
      bookingRow({ id: 'bk-5', status: 'in_progress' }),
    ];

    const views = await handle(rows);

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
    const [view] = await handle([bookingRow({ haircutReferenceId: null })]);

    expect(view?.referenceId).toBeNull();
  });

  it('візит у партії не пропонує повторного запису (T-4617)', async () => {
    const [single, party] = await handle([
      bookingRow(),
      bookingRow({ id: 'bk-2', appointmentId: 'apt-2', partyId: 'party-1' }),
    ]);

    expect(single?.canBookAgain).toBe(true);
    expect(party?.canBookAgain).toBe(false);
  });

  it('показує повернення депозиту, яке вже почалося (T-094)', async () => {
    const { prisma } = prismaOf(
      [bookingRow()],
      [],
      [{ bookingId: 'bk-1', refundStatus: 'processing', capturedRefundAmount: null }]
    );

    const [view] = await new ListClientAppointments(prisma as never).handle('user-1');

    expect(view?.deposit?.refund).toEqual({ status: 'processing', amount: 210 });
  });

  it('називає фактично повернену суму, коли повернення завершене', async () => {
    const { prisma } = prismaOf(
      [bookingRow()],
      [],
      [{ bookingId: 'bk-1', refundStatus: 'completed', capturedRefundAmount: 100 }]
    );

    const [view] = await new ListClientAppointments(prisma as never).handle('user-1');

    expect(view?.deposit?.refund).toEqual({ status: 'completed', amount: 100 });
  });

  it('без повернення поле відсутнє, а не нульове', async () => {
    const [view] = await handle([bookingRow()]);

    expect(view?.deposit).not.toHaveProperty('refund');
  });

  it('віддає ID фото, а не URL: бакет приватний (ADR 0008 §2), REF-WEB-03', async () => {
    const [view] = await handle([bookingRow()]);

    // Раніше тут стояло referenceUrl: '' — мініатюра не могла з'явитися ніколи.
    expect(view).not.toHaveProperty('referenceUrl');
    expect(view?.referenceId).toBe('photo-1');
  });
});
