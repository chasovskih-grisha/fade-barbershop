import {
  createBooking,
  fetchBookingSlots,
  fetchDepositStatus,
  payBookingDeposit,
  todayInKyiv,
} from './booking';

function response(body: unknown): Response {
  return { ok: true, json: async () => body } as Response;
}

describe('mobile booking API (T-071)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('creates a booking through the real API contract', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ id: 'booking-1' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      createBooking({
        locationId: 'loc-1',
        serviceId: 'svc-1',
        date: '2026-11-23',
        start: '10:00',
        end: '10:30',
        barberId: 'barber-1',
      })
    ).resolves.toEqual({ id: 'booking-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:13000/booking/bookings',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('loads availability from the public slots endpoint', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response([{ start: '10:00', end: '10:30', barbers: ['barber-1'] }]));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      fetchBookingSlots({
        locationId: 'loc-1',
        serviceId: 'svc-1',
        date: '2026-11-23',
        barberId: 'barber-1',
      })
    ).resolves.toEqual([{ start: '10:00', end: '10:30', barbers: ['barber-1'] }]);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:13000/booking/slots',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          locationId: 'loc-1',
          serviceId: 'svc-1',
          date: '2026-11-23',
          barberId: 'barber-1',
        }),
      })
    );
  });

  it('maps a paid deposit hold to an already-paid outcome', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ status: 'paid' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchDepositStatus('booking-1', 'resume-1')).resolves.toMatchObject({
      bookingId: 'booking-1',
      outcome: 'already_paid',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:13000/payment/bookings/booking-1/deposit',
      expect.objectContaining({ headers: { 'x-deposit-resume-token': 'resume-1' } })
    );
  });

  it('does not retry a deposit capture and sends the stable request key', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('network'));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(payBookingDeposit('booking-1', 'request-1')).rejects.toThrow('network');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:13000/payment/bookings/booking-1/deposit',
      expect.objectContaining({ headers: { 'Idempotency-Key': 'request-1' } })
    );
  });

  it('formats today in the studio time zone', () => {
    expect(todayInKyiv(new Date('2026-11-23T22:30:00.000Z'))).toBe('2026-11-24');
  });
});
