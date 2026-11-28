import { fetchDepositStatus, payDeposit } from '../bookingApi';

const KEY = '3f1c2b1a-9d4e-4a77-9b52-0c7f2b3d4e5f';

describe('deposit API', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('posts the capture once with the idempotency key and never retries', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(payDeposit('apt-1', KEY)).rejects.toThrow('network down');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/payment/bookings/apt-1/deposit', {
      method: 'POST',
      headers: { 'Idempotency-Key': KEY },
    });
  });

  it('reads the deposit status without a mutation', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'paid', serverNow: new Date().toISOString() }),
    });

    await expect(fetchDepositStatus('apt-1')).resolves.toMatchObject({
      outcome: 'already_paid',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/payment/bookings/apt-1/deposit', {
      cache: 'no-store',
    });
  });
});
