import { apiBase } from './api-base';

// Push-канал пристрою (T-070 mobile / T-4422 безпека). Expo-токен унікальний:
// повторна реєстрація тим самим апаратом (перелогін) переносить рядок на
// поточну сесію. Канал «дозволений» = токен зареєстровано (дозвіл видає ОС).
// Мобільний канал автентифікується Bearer access-токеном (web — cookie).

export type PushPlatform = 'ios' | 'android' | 'web';

async function post(path: string, accessToken: string, body: unknown): Promise<void> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  if (res.ok) return;
  const err = (await res.json().catch(() => ({}))) as { message?: string };
  throw new Error(err.message || `API ${res.status}`);
}

/** Зареєструвати Expo-токен пристрою — канал сповіщень стає активним. */
export function registerPushToken(
  accessToken: string,
  token: string,
  platform?: PushPlatform
): Promise<void> {
  return post('/identity/client/push-tokens', accessToken, {
    token,
    ...(platform ? { platform } : {}),
  });
}

/** Вимкнути канал цього пристрою (вихід з акаунта). Ідемпотентно. */
export function revokePushToken(accessToken: string, token: string): Promise<void> {
  return post('/identity/client/push-tokens/revoke', accessToken, { token });
}
