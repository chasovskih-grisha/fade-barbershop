// §6.2 «Телефонний запис» (admin-screens, T-4409 UI / T-046): логін адміна →
// OTP на номер (код читаємо з Mailpit, не підміняємо) → форма візиту → 201.
//
// Димовий, не повний e2e: перевіряє, що екран зв'язаний наскрізь — тобто падає
// не лише на розриві контракту, а й коли ламається доставка коду або привʼязка
// до клієнта (origin.clientId), яку закрыли 2026-10-02.

import { test, expect, type Page } from '@playwright/test';
import { ADMIN, SEED_CLIENT_PHONE, SEED_BARBER_NAME } from './admin-env';
import { waitForBookingOtp, snapshotBookingOtpIds } from './mailpit-otp';

/**
 * Слот має відповідати трьом обмеженням, інакше 400/409:
 *  1) день — seed:dev створює AvailabilityWindow Пн–Сб (неділя закрита);
 *  2) час — початок має лягти на **15-хв сітку** (09:45 проходить, 09:46 →
 *     400 «Barber has no availability for this slot»);
 *  3) унікальність — щоб повторний прогон не впився у 409 «No free chairs»
 *     (у локації рівно 2 крісла), беремо інший 15-хв крок від поточного часу.
 */
function slot(): { date: string; start: string; end: string } {
  const day = new Date();
  day.setDate(day.getDate() + (day.getDay() === 0 ? 2 : 1)); // неділя закрита
  const step = Math.floor(Date.now() / 900_000) % 30; // 30 кроків × 15 хв = 09:00–16:15
  const minutes = 9 * 60 + step * 15;
  const pad = (n: number) => String(n).padStart(2, '0');
  const hhmm = (total: number) => `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  return {
    date: `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`,
    start: hhmm(minutes),
    end: hhmm(minutes + 30),
  };
}

/** §6.2 крок 1: логін адміна. «Вийти» зникає й під час завантаження
 * (кнопка перейменовується на «Вхід…»), тож toBeHidden давав хибно-зелений
 * результат навіть при 429 — тому позитивна перевірка видимості. */
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Ім’я користувача').fill(ADMIN.username);
  await page.getByLabel('Пароль').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Увійти' }).click();
  await expect(page.getByRole('button', { name: 'Вийти' })).toBeVisible();
}

type MailpitSnapshot = Awaited<ReturnType<typeof snapshotBookingOtpIds>>;

/** §6.2 крок 2: номер → «Надіслати код»; повертає знімок Mailpit ДО надсилання
 * (Mailpit персистентний — без нього тест читає код попереднього прогону). */
async function sendOtp(page: Page, phone: string): Promise<MailpitSnapshot> {
  const before = await snapshotBookingOtpIds(phone);
  await page.goto('/bookings/phone');
  await page.getByLabel('Номер клієнта').fill(phone);
  await page.getByRole('button', { name: 'Надіслати код' }).click();
  // Будь-яка помилка надсилання (кулдаун OTP_RESEND_SEC=60, 429, 5xx) означає,
  // що листа не буде — чекати далі марно. Селектор навмисно НЕ getByRole('alert'):
  // на сторінці завжди є порожній alert-вузол-обгортка, тож роль-локатор
  // збігається навіть коли помилки немає.
  const sendError = page.locator('section[aria-label="Верифікація номера"] p[role="alert"]');
  try {
    await expect(sendError).toBeHidden({ timeout: 4_000 });
  } catch {
    const text = (await sendError.first().textContent())?.trim() ?? 'невідома помилка';
    throw new Error(`OTP на ${phone} не надіслано: ${text}`);
  }
  return before;
}

test.describe('§6.2 Телефонний запис', () => {
  test('логін → OTP із Mailpit → візит, привʼязаний до клієнта', async ({ page }) => {
    // ── 1–2. Логін → номер → «Надіслати код» ──────────────────────────────
    await loginAsAdmin(page);
    const before = await sendOtp(page, SEED_CLIENT_PHONE);

    // ── 3. Код із справжнього каналу (Mailpit), а не зі стабу ──────────────
    const code = await waitForBookingOtp(SEED_CLIENT_PHONE, { after: before });
    await page.getByLabel('Код з SMS (клієнт диктує)').fill(code);
    await page.getByRole('button', { name: 'Підтвердити' }).click();

    // ── 4. Форма візиту ───────────────────────────────────────────────────
    const submit = page.getByRole('button', { name: 'Створити візит' });
    await expect(submit).toBeEnabled(); // довідники доїхали
    // Картка верифікованого клієнта: імʼя з CRM, а не лише номер.
    const clientCard = page.getByRole('region', { name: 'Верифікований клієнт' });
    await expect(clientCard).toBeVisible();
    await expect(clientCard).toContainText(SEED_CLIENT_PHONE);
    await expect(clientCard).toContainText(/Візитів: \d+/);
    await page.getByLabel('Барбер').selectOption({ label: SEED_BARBER_NAME });
    await page.getByLabel('Локація').selectOption({ index: 1 });
    const when = slot();
    await page.getByLabel('Дата').fill(when.date);
    await page.getByLabel('Початок').fill(when.start);
    await page.getByLabel('Кінець').fill(when.end);
    await submit.click();
    await expect(page.getByRole('status')).toHaveText('Візит створено.');

    // ── 5. Візит реально привʼязаний до клієнта (T-046) ───────────────────
    // Раніше тут було clientId: null — запис створювався, але клієнт його не
    // бачив у «Моїх візитах». page.request ділиться cookie з браузером, тому
    // admin-календар читається без окремого логіну. Параметр один — ?date=.
    const calendar = await page.request.get(`/admin/calendar?date=${when.date}`);
    expect(calendar.status(), 'admin-календар не віддав день візиту').toBe(200);
    const body = (await calendar.json()) as {
      visits: Array<{ start: string; clientId: string | null; source?: string }>;
    };
    // Календар віддає start повним ISO (2026-10-03T09:45:00.000Z), а не «09:45».
    const created = body.visits.find((v) => v.start.startsWith(`${when.date}T${when.start}`));
    if (!created) throw new Error('створений візит не знайдено в адмін-календарі');
    expect(created.source).toBe('admin');
    expect(created.clientId, 'origin.clientId порожній — візит без привʼязки').toBeTruthy();
  });
});
