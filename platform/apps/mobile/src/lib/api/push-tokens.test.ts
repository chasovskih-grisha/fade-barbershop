// Push-канал пристрою (T-070/T-4422): клієнт шле Expo-токен із Bearer
// access-токеном; платформа додається лише коли її передано.
import { registerPushToken, revokePushToken } from './push-tokens';
import { apiBase } from './api-base';

const originalFetch = global.fetch;
const TOKEN = 'ExpoPushToken[device-1]';

function mockJson(body: unknown = { ok: true }, status = 200) {
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

describe('push-tokens (T-070/T-4422)', () => {
  it('реєструє токен із платформою (Bearer)', async () => {
    global.fetch = mockJson();

    await registerPushToken('access-1', TOKEN, 'ios');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/identity/client/push-tokens',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer access-1' }),
        body: JSON.stringify({ token: TOKEN, platform: 'ios' }),
      })
    );
  });

  it('без платформи поле не додається (сервер підставить дефолт)', async () => {
    global.fetch = mockJson();

    await registerPushToken('access-1', TOKEN);

    const body = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.body as string;
    expect(JSON.parse(body)).toEqual({ token: TOKEN });
  });

  it('revoke шле токен на /revoke', async () => {
    global.fetch = mockJson({ ok: true, revoked: true });

    await revokePushToken('access-1', TOKEN);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/identity/client/push-tokens/revoke',
      expect.objectContaining({ body: JSON.stringify({ token: TOKEN }) })
    );
  });

  it('помилка API не маскується (400 → Error з message)', async () => {
    global.fetch = mockJson({ message: 'Некоректний токен' }, 400);

    await expect(registerPushToken('access-1', 'сміття')).rejects.toThrow('Некоректний токен');
  });

  it('apiBase поважає MOBILE_API_BASE', () => {
    expect(apiBase()).toBe('http://api.test');
  });
});
