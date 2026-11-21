// Крайові випадки деталей візиту: відсутні клієнт/події/партія, журнал без
// appointmentId, порожні ноги партії та невідомий тип події. Сенс — форма
// відповіді лишається повною й без порожніх рядків.
import { bookingRow, outboxRow, partyRow, setup } from './admin-booking-detail.fixtures';

describe('AdminBookingDetail: часткові дані', () => {
  it('без клієнта і без подій: картка CRM не читається, журнал порожній', async () => {
    const { readModel, prisma } = setup({
      booking: {
        findUnique: jest.fn().mockResolvedValue({ ...bookingRow, clientId: null, status: null }),
      },
      outboxMessage: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const detail = await readModel.handle('bk-1');
    expect(detail).toMatchObject({ client: null, status: 'booked', events: [], notifications: [] });
    expect(prisma.clientProfile.findUnique).not.toHaveBeenCalled();
    expect(prisma.notificationRecord.findMany).not.toHaveBeenCalled();
  });

  it('без appointmentId журнал читається за id самого запису', async () => {
    const { readModel, prisma } = setup({
      booking: { findUnique: jest.fn().mockResolvedValue({ ...bookingRow, appointmentId: null }) },
    });
    await readModel.handle('bk-1');
    expect(prisma.outboxMessage.findMany.mock.calls[0][0].where.aggregateId).toBe('bk-1');
  });

  it('партія father-son розкривається повністю, клієнт без картки CRM не ламає відповідь', async () => {
    const { readModel } = setup({
      booking: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ ...bookingRow, partyId: 'party-1', partyRole: 'father' }),
      },
      clientProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      appointmentParty: { findUnique: jest.fn().mockResolvedValue(partyRow) },
    });
    expect(await readModel.handle('bk-1')).toMatchObject({
      partyRole: 'father',
      party: {
        id: 'party-1',
        role: 'father-son',
        mode: 'parallel',
        barberIds: ['barber-1', 'barber-2'],
        agreedPrice: 1200,
        date: '2026-11-09T10:00:00.000Z',
        legs: [{ barberId: 'barber-2' }],
      },
      client: { profileId: null, vipDiscountPercent: null, loyaltyVisitsCount: null },
    });
  });

  it('порожнє partyLegs не дає нерозміченого legs у відповіді', async () => {
    const { readModel } = setup({
      booking: { findUnique: jest.fn().mockResolvedValue({ ...bookingRow, partyId: 'party-1' }) },
      appointmentParty: {
        findUnique: jest.fn().mockResolvedValue({ ...partyRow, partyLegs: null }),
      },
    });
    expect((await readModel.handle('bk-1'))?.party?.legs).toEqual([]);
  });

  it('подія без агента і деталей не лишає порожніх рядків', async () => {
    const { readModel } = setup({
      outboxMessage: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ ...outboxRow, payload: {}, type: 'unknown.type' }]),
      },
    });
    expect((await readModel.handle('bk-1'))?.events?.[0]).toMatchObject({
      label: 'unknown.type',
      actor: null,
      details: [],
    });
  });
});
