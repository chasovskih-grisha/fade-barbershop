import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { registerPushToken, type PushPlatform } from '@/lib/api/push-tokens';
import { revokePushToken } from './push-revoke';
import { registerForPushNotificationsAsync } from '@/lib/push-setup';

/**
 * T-070 (реopened): реєстрація Expo push-токена після створення сесії.
 *
 * Правила:
 * - Токен реєструється **тільки коли є валідний сесійний токен** — анонімний
 *   кидання токена на сервер прибирається.
 * - Реєстрація коректного токена на тому ж пристрої переносить рядок на
 *   поточну сесію (сервер-side контракт T-4422). Тому повторний виклик під
 *   новим токеном коректний і не потрібно боятися подвійної реєстрації.
 * - Коли дозвіл на сповіщення відмовлено або не визначено — не кидаємо
 *   конфігураційну помилку і не придумуємо токен; просто не реєструємо.
 * - Помилки мережі/refresh — ігноруються тихо: у домашній оболонці вони не
 *   блокують вхі드, а токен першим десь з'явиться після пушу.
 * - Реєстрація відбувається один раз за ініціативу хука (не кожен ререндер),
 *   а повторне сane перевіряє, чи сесія змінилася — тоді пробує знову.
 */
/** Платформа пристрою для серверного рядка PushToken; web у застосунку не буває. */
export function devicePlatform(): PushPlatform {
  return Platform.OS === 'android' ? 'android' : 'ios';
}

export function usePushRegistration() {
  const [error, setError] = useState<string | null>(null);
  const scheduledRef = useRef<string | null>(null);

  const register = useCallback(async (accessToken: string) => {
    if (!accessToken) return;
    if (scheduledRef.current === accessToken) return;

    scheduledRef.current = accessToken;

    try {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        // Токен не прийшов (мережа/ЕАS) — дозволяємо повторну спробу.
        scheduledRef.current = null;
        return;
      }
      await registerPushToken(accessToken, token, devicePlatform());
      setError(null);
    } catch (err) {
      // Після відмови людина може увімкнути сповіщення в налаштуваннях —
      // наступний register() з тим самим сеансом має спробувати знову.
      scheduledRef.current = null;
      // Не ламати UI: момент не вдалося — токен з'явиться пізніше або ніколи.
      const message = err instanceof Error ? err.message : 'Push registration failed';
      if (message.includes('permission denied') || message.includes('not granted')) {
        setError('Сповіщення вимкнено на цьому пристрої');
      } else {
        setError(message);
      }
    }
  }, []);

  const revoke = useCallback(async (token: string | null) => {
    if (!token) return;
    try {
      await revokePushToken(token);
    } catch {
      setError(null);
      // Сервер може не відповісти — локально push все одно вимикаємо.
    }
  }, []);

  useEffect(() => {
    return () => {
      scheduledRef.current = null;
    };
  }, []);

  return { register, revoke, error };
}
