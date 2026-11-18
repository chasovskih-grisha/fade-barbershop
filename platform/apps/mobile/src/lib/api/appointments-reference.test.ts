// REF-MOB-02 (правило REF-WEB-04): команда зміни референсу/коментаря з
// «Моїх візитів» на мобільному — той самий маршрут і контракт, що на web.
// `undefined` — не чіпати поле, `''` — прибрати значення; 409 — серверний замок
// після підтвердження барбером, який UI має відрізняти від мережевої помилки.
import { ApiError, setAppointmentReference } from './appointments';

const originalFetch = global.fetch;

function mockJson(body: unknown, status = 200) {
  return jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.MOBILE_API_BASE = 'http://api.test';
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.MOBILE_API_BASE;
});

describe('setAppointmentReference', () => {
  it('шле лише змінені поля у POST /appointments/:id/reference', async () => {
    global.fetch = mockJson({ status: 'ok' });

    await setAppointmentReference('a1', { comment: 'коротше' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/appointments/a1/reference',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ comment: 'коротше' }),
      })
    );
  });

  it('порожній referenceId означає «прибрати фото», а не «не чіпати»', async () => {
    global.fetch = mockJson({ status: 'ok' });

    await setAppointmentReference('a1', { referenceId: '' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/appointments/a1/reference',
      expect.objectContaining({ body: JSON.stringify({ referenceId: '' }) })
    );
  });

  it('без тіла не ставить Content-Type', async () => {
    global.fetch = mockJson({ status: 'ok' });

    await setAppointmentReference('a1', {});

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/appointments/a1/reference',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('409 стає ApiError зі статусом — UI відрізняє замок від мережі', async () => {
    global.fetch = mockJson({ message: 'Reference is locked after confirmation' }, 409);

    await expect(setAppointmentReference('a1', { comment: 'x' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
    });
  });

  it('помилка валідації зберігає і статус, і повідомлення сервера', async () => {
    global.fetch = mockJson({ message: 'Comment must be 500 characters or fewer' }, 400);

    const error = await setAppointmentReference('a1', { comment: 'x' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as Error).message).toBe('Comment must be 500 characters or fewer');
  });
});
