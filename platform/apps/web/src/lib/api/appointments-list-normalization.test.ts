import { getAppointments } from './appointments';

describe('список візитів — нормалізація', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('нормалізує відповідь до повного типу (null → null, не undefined)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'apt-1',
          date: '2026-10-02',
          startTime: '11:00',
          endTime: '11:45',
          serviceName: 'Стрижка',
          barberName: 'Олексій',
          locationName: 'Поділ',
          price: 600,
          status: 'upcoming',
          referenceId: null,
          referenceComment: '',
          canEditReference: true,
        },
      ],
    });
    await expect(getAppointments()).resolves.toEqual([
      {
        id: 'apt-1',
        date: '2026-10-02',
        startTime: '11:00',
        endTime: '11:45',
        serviceName: 'Стрижка',
        barberName: 'Олексій',
        locationName: 'Поділ',
        price: 600,
        status: 'upcoming',
        referenceId: null,
        referenceComment: '',
        canEditReference: true,
        canBookAgain: true,
        cancelReason: null,
        deposit: null,
      },
    ]);
  });

  it('пропускає снепшот депозиту з API (сума + дедлайн)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'apt-1',
          status: 'upcoming',
          deposit: { amount: 210, freeCancelUntil: '2026-09-28T08:00:00.000Z' },
        },
      ],
    });
    const [appointment] = await getAppointments();
    expect(appointment?.deposit).toEqual({
      amount: 210,
      freeCancelUntil: '2026-09-28T08:00:00.000Z',
    });
  });

  it('снепшот без вікна скасування лишає дедлайн null (діалог мовчить)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'apt-1', status: 'upcoming', deposit: { amount: 210 } }],
    });
    const [appointment] = await getAppointments();
    expect(appointment?.deposit).toEqual({ amount: 210, freeCancelUntil: null });
  });

  it('відсутнє право редагування трактується як «ні», а не undefined', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'apt-1', status: 'confirmed' }],
    });
    const [appointment] = await getAppointments();
    expect(appointment?.canEditReference).toBe(false);
    expect(appointment?.referenceId).toBeNull();
  });
});
