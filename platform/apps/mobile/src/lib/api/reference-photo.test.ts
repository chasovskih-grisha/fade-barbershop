// Підписаний URL референсу (REF-WEB-03, ADR 0008 §2): бакет приватний, тож
// екран бере url окремим запитом. 401/404 — просто без фото, без помилки.
import { getReferencePhotoUrl, uploadReferencePhoto } from './reference-photo';

const originalFetch = global.fetch;

beforeEach(() => {
  process.env.MOBILE_API_BASE = 'http://api.test';
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.MOBILE_API_BASE;
});

describe('getReferencePhotoUrl', () => {
  it('повертає підписаний url з відповіді', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ url: 'https://minio.local/p.png?X-Amz-Signature=abc' }),
    })) as unknown as typeof fetch;

    await expect(getReferencePhotoUrl('photo-1')).resolves.toBe(
      'https://minio.local/p.png?X-Amz-Signature=abc'
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/booking/reference-photos/photo-1',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('екранує id у шляху', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ url: 'x' }),
    })) as unknown as typeof fetch;

    await getReferencePhotoUrl('a/b?c');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/booking/reference-photos/a%2Fb%3Fc',
      expect.anything()
    );
  });

  it('401/404 — null, без помилки на екрані', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(getReferencePhotoUrl('photo-1')).resolves.toBeNull();
  });

  it('без url у тілі — null', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(getReferencePhotoUrl('photo-1')).resolves.toBeNull();
  });
});

/**
 * REF-MOB-01 / REF-WEB-05: те саме multipart-вивантаження, що й у web-флоу
 * (поле `file`, ≤ 10 МБ), тож id, який вертає сервер, кладеться у `referenceId`.
 */
describe('uploadReferencePhoto', () => {
  const picked = { uri: 'file:///tmp/p.jpg', name: 'p.jpg', type: 'image/jpeg' };

  it('шле multipart на /booking/reference-photos і повертає photoId', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ photoId: 'photo-9' }),
    })) as unknown as typeof fetch;
    global.fetch = fetchMock;

    await expect(uploadReferencePhoto(picked)).resolves.toBe('photo-9');

    const [, init] = (fetchMock as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect((fetchMock as jest.Mock).mock.calls[0]?.[0]).toBe(
      'http://api.test/booking/reference-photos'
    );
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    // Content-Type не ставимо самі: межу multipart формує рантайм.
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('422 з тіла сервера стає повідомленням для користувача', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Файл має бути зображенням' }),
    })) as unknown as typeof fetch;

    await expect(uploadReferencePhoto(picked)).rejects.toThrow('Файл має бути зображенням');
  });

  it('відповідь без photoId — помилка, а не «тихий» успіх', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(uploadReferencePhoto(picked)).rejects.toThrow('Сервер не повернув id фото');
  });
});
