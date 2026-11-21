import { getAppointments } from './appointments';

describe('список візитів — помилки API', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
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
});
