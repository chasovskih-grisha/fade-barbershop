import { getBarberOnsiteStatus, payBarberOnsite } from './barber-onsite';

function response(body: unknown): Response {
  return { ok: true, json: async () => body } as Response;
}

describe('barber on-site API', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('reads status with the barber bearer token', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ bookingId: 'bk-1' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await getBarberOnsiteStatus('bk-1', 'barber-token');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:13000/barber/payments/bookings/bk-1/onsite',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer barber-token' }),
      })
    );
  });

  it('posts cash to the barber-scoped route without trusting a client actor', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ outcome: 'captured' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await payBarberOnsite('bk-1', 'cash', 'barber-token');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ bookingId: 'bk-1', form: 'cash' });
    expect(init.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer barber-token',
        'Content-Type': 'application/json',
      })
    );
  });
});
