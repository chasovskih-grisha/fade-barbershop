// Специфікація read-моделі деталей візиту (admin-screens §5.2): повна
// відповідь GET /admin/bookings/:id + стан опублікованої події й імені
// клієнта з картки CRM. Prisma — фейк: фіксуємо вибірки й мапінг.
import { outboxRow, setup } from './admin-booking-detail.fixtures';

describe('AdminBookingDetail (admin-screens §5.2)', () => {
  it('складає деталі візиту: час, ціна, послуга, локація, барбер, клієнт, історія', async () => {
    const { readModel, prisma } = setup();
    const detail = await readModel.handle('bk-1');
    expect(detail).toMatchObject({
      id: 'bk-1',
      appointmentId: 'apt-1',
      status: 'confirmed',
      start: '2026-11-09T10:00:00.000Z',
      durationMinutes: 30,
      agreedPrice: 600,
      agreedDuration: 60,
      durationVariant: 'long',
      source: 'admin',
      comment: 'Без машинки',
      service: { name: 'Стрижка' },
      location: { name: 'Сіті Лейк' },
      barber: { name: 'Іван', phone: '+380501111111' },
      client: { name: 'Марко', profileId: 'cp-1', vipDiscountPercent: 10, loyaltyVisitsCount: 3 },
    });
    expect(detail?.events?.[0]).toMatchObject({
      label: 'Перенесено',
      status: 'pending',
      publishedAt: null,
      actor: 'admin · admin-1',
      details: [
        '2026-11-09T09:00:00.000Z–2026-11-09T09:30:00.000Z → 2026-11-09T10:00:00.000Z–2026-11-09T10:30:00.000Z',
      ],
    });
    expect(detail?.notifications?.[0]).toMatchObject({
      channel: 'email',
      recipient: 'a@b.c',
      subject: 'Візит перенесено',
    });
    expect(prisma.notificationRecord.findMany.mock.calls[0][0].where.eventId).toEqual({
      in: ['msg-1'],
    });
    expect(prisma.outboxMessage.findMany.mock.calls[0][0].where.aggregateId).toBe('apt-1');
  });

  it('візиту немає — null, довідники не читаються', async () => {
    const { readModel, prisma } = setup({
      booking: { findUnique: jest.fn().mockResolvedValue(null) },
    });
    expect(await readModel.handle('missing')).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('опублікована подія позначається як published, а не «у черзі»', async () => {
    const { readModel } = setup({
      outboxMessage: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ ...outboxRow, publishedAt: new Date('2026-11-08T12:00:03.000Z') }]),
      },
    });
    expect((await readModel.handle('bk-1'))?.events?.[0]).toMatchObject({
      status: 'published',
      publishedAt: '2026-11-08T12:00:03.000Z',
    });
  });

  it('ім’я клієнта береться з картки CRM, якщо User.name порожній', async () => {
    const { readModel } = setup({
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'user-1', name: null, phone: '+380502223344' }),
      },
    });
    expect((await readModel.handle('bk-1'))?.client?.name).toBe('Марко К.');
  });

  it('читає обраний варіант тривалості зі снепшоту (T-4419)', async () => {
    const { readModel } = setup();
    const detail = await readModel.handle('bk-1');
    expect(detail?.durationVariant).toBe('long');
    expect(detail?.agreedDuration).toBe(60);
  });
});
