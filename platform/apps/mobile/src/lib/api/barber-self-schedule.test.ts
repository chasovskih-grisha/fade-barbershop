import {
  getBarberSchedule,
  getBarberScheduleLocations,
  markBarberUnavailable,
} from './barber-self-schedule';

function response(body: unknown): Response {
  return { ok: true, json: async () => body } as Response;
}

describe('barber self-schedule API (T-4616b)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('читає локації барбера з його сесією', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ barberId: 'b-1', locations: [] }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await getBarberScheduleLocations('barber-token');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:13000/barber/schedule',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer barber-token' }),
      })
    );
  });

  it('читає графік локації (прапорець canEdit приходить із сервера)', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ canEdit: false }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const view = await getBarberSchedule('loc-1', 'barber-token');

    expect(view.canEdit).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:13000/barber/schedule/loc-1',
      expect.anything()
    );
  });

  it('позначає добу без зайвих полів у тілі', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ conflictsCreated: 2 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await markBarberUnavailable(
      'loc-1',
      { start: '2026-12-01T00:00:00.000Z', end: '2026-12-02T00:00:00.000Z', reason: 'лікар' },
      'barber-token'
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:13000/barber/schedule/loc-1/unavailability');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      start: '2026-12-01T00:00:00.000Z',
      end: '2026-12-02T00:00:00.000Z',
      reason: 'лікар',
    });
  });

  it('віддає серверну причину відмови, а не «API 403»', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Schedule editing is not delegated to the barber' }),
    }) as unknown as typeof fetch;

    await expect(
      markBarberUnavailable(
        'loc-1',
        { start: '2026-12-01T00:00:00.000Z', end: '2026-12-02T00:00:00.000Z' },
        'token'
      )
    ).rejects.toThrow('Schedule editing is not delegated to the barber');
  });
});
