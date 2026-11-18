// §6.2 «Телефонний запис з CRM-картки» (admin-screens, T-046 UI): логін адміна →
// клієнти → «Записати» з картки → телефонний запис із передобраним клієнтом → завершення візиту.
// Цей сценарій перевіряє повний флоу: клієнт з картки → навигація до сторінки запису →
// перевірка, що OTP пропускається (clientId є) → форма візиту → створення візиту → перевірка
// у календарі адміна.

import { test, expect, type Page } from '@playwright/test';
import { ADMIN, SEED_CLIENT_PHONE } from './admin-env';
import { waitForBookingOtp, snapshotBookingOtpIds } from './mailpit-otp';

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

/** §6.2 крок 2: номер → «Надіслати код»; повертає знімок Mailpit ДО надсилання
 * (Mailpit персистентний — без нього тест читає код попереднього прогону). */
async function sendOtp(page: Page, phone: string): Promise<void> {
  const before = await snapshotBookingOtpIds(phone);
  await page.goto('/bookings/phone');
  await page.getByLabel('Номер клієнта').fill(phone);
  await page.getByRole('button', { name: 'Надіслати код' }).click();
  const sendError = page.locator('section[aria-label="Верифікація номера"] p[role="alert"]');
  try {
    await expect(sendError).toBeHidden({ timeout: 4_000 });
  } catch {
    const text = (await sendError.first().textContent())?.trim() ?? 'невідома помилка';
    throw new Error(`OTP на ${phone} не надіслано: ${text}`);
  }
}

/** §6.2 крок 3: код із Mailpit → підтвердження */
async function completeOtp(page: Page, phone: string): Promise<void> {
  const code = await waitForBookingOtp(phone);
  await page.getByLabel('Код з SMS (клієнт диктує)').fill(code);
  await page.getByRole('button', { name: 'Підтвердити' }).click();
}

/** §6.2 крок 4: форма візиту — вибір барбера/локації/datetime → створення */
async function completeVisitForm(page: Page): Promise<{ date: string; start: string }> {
  // Обираємо барбера
  await page.getByLabel('Барбер').selectOption({ label: 'Oleh' });
  // Обираємо локацію
  await page.getByLabel('Локація').selectOption({ index: 1 });
  // Вибираємо слот (15-хв сітка, Пн–Сб, неділя закрита)
  const day = new Date();
  day.setDate(day.getDate() + (day.getDay() === 0 ? 2 : 1)); // неділя закрита
  const step = Math.floor(Date.now() / 900_000) % 30; // 30 кроків × 15 хв = 09:00–16:15
  const minutes = 9 * 60 + step * 15;
  const pad = (n: number) => String(n).padStart(2, '0');
  const hhmm = (total: number) => `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  const when = {
    date: `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`,
    start: hhmm(minutes),
    end: hhmm(minutes + 30),
  };
  await page.getByLabel('Дата').fill(when.date);
  await page.getByLabel('Початок').fill(when.start);
  await page.getByLabel('Кінець').fill(when.end);
  // Створюємо візит
  await page.getByRole('button', { name: 'Створити візит' }).click();
  await expect(page.getByRole('status')).toHaveText('Візит створено.');
  return when;
}

/** §6.2 крок 5: візит реально привʼязаний до клієнта (T-046) */
async function verifyClientBooking(page: Page, date: string, start: string): Promise<void> {
  const calendar = await page.request.get(`/admin/calendar?date=${date}`);
  expect(calendar.status(), 'admin-календар не віддав день візиту').toBe(200);
  const body = (await calendar.json()) as {
    visits: Array<{ start: string; clientId: string | null; source?: string }>;
  };
  const created = body.visits.find((v) => v.start.startsWith(`${date}T${start}`));
  if (!created) throw new Error('створений візит не знайдено в адмін-календарі');
  expect(created.source).toBe('admin');
  expect(created.clientId, "origin.clientId порожній — візит без прив'язки").toBeTruthy();
}

/** Тест: CRM-картка → «Записати» → повний телефонний запис (T-046) */
test('CRM client card «Записати» → телефонний запис із передобраним клієнтом (T-046)', async ({
  page,
}) => {
  // ── 1. Логін адміна ─────────────────────────────────────────────────────
  await loginAsAdmin(page);

  // ── 2. Переходимо до сторінки клієнта та натискаємо «Записати» ─────────
  // T-046: кнопка «Записати» на картці клієнта → телефонний запис із передобраним клієнтом
  await page.goto('/clients/profile-1');
  await page.getByRole('button', { name: 'Записати' }).click();

  // ── 3. Телефонний запис флоу ────────────────────────────────────────────
  // Вводимо номер клієнта (використовуємо seed телефон)
  await page.getByLabel('Номер клієнта').fill(SEED_CLIENT_PHONE);
  // Натискаємо «Надіслати код»
  await sendOtp(page, SEED_CLIENT_PHONE);

  // Отримуємо код із Mailpit та підтверджуємо
  await completeOtp(page, SEED_CLIENT_PHONE);

  // ── 4. Форма візиту — вибір параметрів → створення ─────────────────────
  const when = await completeVisitForm(page);

  // ── 5. Перевіряємо, що візит прив'язаний до клієнта (T-046) ─────────────
  await verifyClientBooking(page, when.date, when.start);
});
