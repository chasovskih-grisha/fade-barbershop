// Контракт «Мої візити» на мобільному (GET /booking/appointments): клієнт
// застосовує той самий CABINET_STATUS, що й сервер, тож доменний статус
// перетворюється в статус кабінету навіть якщо сервер віддав сире значення.
import { getAppointments } from './appointments';
import { apiBase } from './api-base';

const originalFetch = global.fetch;

function mockJson(body: unknown, status = 200) {
  return jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

const raw = (overrides: Record<string, unknown> = {}) => ({
  id: 'a',
  date: '2030-05-12',
  startTime: '10:00',
  serviceName: 'Стрижка',
  barberName: 'Олекса',
  locationName: 'Поділ',
  price: 600,
  status: 'booked',
  ...overrides,
});

beforeEach(() => {
  process.env.MOBILE_API_BASE = 'http://api.test';
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.MOBILE_API_BASE;
});

describe('getAppointments', () => {
  it('мапить доменні статуси через CABINET_STATUS', async () => {
    global.fetch = mockJson([
      raw({ id: 'a', status: 'booked' }),
      raw({ id: 'b', status: 'in_progress' }),
      raw({ id: 'c', status: 'no_show' }),
      raw({ id: 'd', status: 'completed' }),
    ]);

    const result = await getAppointments();
    expect(result.map((a) => a.status)).toEqual([
      'upcoming',
      'confirmed',
      'cancelled',
      'completed',
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/booking/appointments',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('нормалізує відсутні поля (referenceId/comment/canEditReference/endTime)', async () => {
    global.fetch = mockJson([raw()]);
    const result = await getAppointments();
    expect(result).toHaveLength(1);
    const app = result[0];
    expect(app?.endTime).toBe('');
    expect(app?.referenceId).toBeNull();
    expect(app?.referenceComment).toBe('');
    expect(app?.canEditReference).toBe(false);
  });

  it('невідомий статус не потрапляє на екран сирим', async () => {
    global.fetch = mockJson([raw({ status: 'mystery' })]);
    const result = await getAppointments();
    expect(['upcoming', 'confirmed', 'completed', 'cancelled']).toContain(result[0]?.status);
  });

  it('помилка маршруту не маскується порожнім кабінетом', async () => {
    global.fetch = mockJson({ message: 'Not Found' }, 404);
    await expect(getAppointments()).rejects.toThrow('Not Found');
  });

  it('apiBase поважає MOBILE_API_BASE', () => {
    expect(apiBase()).toBe('http://api.test');
  });
});
