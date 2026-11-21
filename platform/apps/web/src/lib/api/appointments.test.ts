import { cancelAppointment, rescheduleAppointment } from './appointments';

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
