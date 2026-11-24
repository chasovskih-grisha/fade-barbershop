// T-4619b resume: the cabinet needs the booking id, hold deadline and release
// state so a closed tab can be reopened without guessing the payment window.
import { ListClientAppointments } from './list-client-appointments';
import { bookingRow, prismaOf } from './list-client-appointments.fakes';

describe('ListClientAppointments deposit hold', () => {
  it('returns bookingId, server deadline and active state for payment resume', async () => {
    const expiresAt = new Date('2026-09-28T12:15:00.000Z');
    const { prisma } = prismaOf(
      [bookingRow()],
      [{ appointmentId: 'bk-1', expiresAt, status: 'active' }]
    );

    const [view] = await new ListClientAppointments(prisma as never).handle('user-1');

    expect(view?.deposit).toEqual({
      amount: 210,
      freeCancelUntil: '2026-09-28T08:00:00.000Z',
      bookingId: 'bk-1',
      expiresAt: '2026-09-28T12:15:00.000Z',
      holdStatus: 'active',
    });
  });

  it('returns the released state instead of an active payment', async () => {
    const { prisma } = prismaOf(
      [bookingRow()],
      [
        {
          appointmentId: 'bk-1',
          expiresAt: new Date('2026-09-28T12:15:00.000Z'),
          status: 'expired',
        },
      ]
    );

    const [view] = await new ListClientAppointments(prisma as never).handle('user-1');

    expect(view?.deposit?.holdStatus).toBe('expired');
  });
});
