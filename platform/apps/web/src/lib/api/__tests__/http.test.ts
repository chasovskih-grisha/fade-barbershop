import { loadItem, loadList } from '../http';

// SSR-хелпер (T-4513): кожен шлях API має давати стан, а не кидати помилку
// на сервері. Тест звіряє всі чотири переходи й тексти, які бачить гість.

const jsonResponse = (body: unknown, status = 200): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('loadList', () => {
  it('ok зі списком', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: '1' }]));
    await expect(loadList<{ id: string }>('/locations')).resolves.toEqual({
      state: 'ok',
      data: [{ id: '1' }],
    });
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:13000/locations');
  });

  it('порожній масив — це empty, а не ok([])', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await expect(loadList('/locations')).resolves.toEqual({ state: 'empty' });
  });

  it('404 списку — notFound, 5xx — error з людським текстом', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 404));
    await expect(loadList('/locations')).resolves.toEqual({ state: 'notFound' });

    fetchMock.mockResolvedValueOnce(jsonResponse(null, 503));
    const failed = await loadList('/locations');
    expect(failed.state).toBe('error');
    expect(failed.state === 'error' && failed.message).toBe(
      'Сервіс недоступний. Спробуйте за кілька хвилин.'
    );
  });

  it('обрив мережі — error, а не виняток на сервері', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const result = await loadList('/locations');
    expect(result.state).toBe('error');
    expect(result.state === 'error' && result.message).toContain('з’єднання');
  });
});

describe('loadItem', () => {
  it('ok з об’єктом', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: 'BAUMANA' }));
    await expect(loadItem<{ code: string }>('/locations/BAUMANA')).resolves.toEqual({
      state: 'ok',
      data: { code: 'BAUMANA' },
    });
  });

  it('404 — notFound (сторінка покаже 404, а не «помилка завантаження»)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 404));
    await expect(loadItem('/locations/NOPE')).resolves.toEqual({ state: 'notFound' });
  });

  it('стан empty в детальці неможливий — помилка лишається error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 500));
    const result = await loadItem('/locations/BAUMANA');
    expect(result.state).toBe('error');
  });
});
