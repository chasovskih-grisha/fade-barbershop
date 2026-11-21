import { cancelAppointment, getAppointments, rescheduleAppointment } from './appointments';

describe('команди візиту', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('скасування йде на /appointments/:id/cancel', async () => {
    await cancelAppointment('apt-1');
    expect(fetchMock).toHaveBeenCalledWith(
      '/appointments/apt-1/cancel',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });

  it('перенесення передає date, start і end', async () => {
    await rescheduleAppointment('apt-1', { date: '2026-10-02', start: '11:00', end: '11:45' });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify({ date: '2026-10-02', start: '11:00', end: '11:45' }));
  });
});

describe('список візитів', () => {
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

  // Регресія: 404 перетворювався на [], тож відсутній маршрут виглядав як
  // «у вас немає візитів» — без жодної помилки на екрані.
  it('404 — це помилка, а не порожній кабінет', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not Found' }),
    });
    await expect(getAppointments()).rejects.toThrow('Not Found');
  });

  it('401 (сесія протухла) не маскується порожнім списком', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });
    await expect(getAppointments()).rejects.toThrow('Unauthorized');
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
