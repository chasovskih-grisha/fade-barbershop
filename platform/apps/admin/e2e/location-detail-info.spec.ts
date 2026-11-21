// §1 «Детальна сторінка локації» — інфо-блоки (T-4525a): логін адміна →
// список локацій → «Редагувати» → шапка зі статусом, години з кріслами,
// особливі дати. Димовий e2e: падає на розриві маршруту, контракту локації
// або привʼязки блоків, а не лише на візуальній дрібниці.
//
// Стенд зовнішній (як phone-booking.spec.ts): `pnpm e2e:admin` очікує
// запущені admin (:13002), API (:13000, docker) з сідом `seed:dev`.

import { test, expect, type Page } from '@playwright/test';
import { ADMIN } from './admin-env';

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Ім’я користувача').fill(ADMIN.username);
  await page.getByLabel('Пароль').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Увійти' }).click();
  await expect(page.getByRole('button', { name: 'Вийти' })).toBeVisible();
}

/** Перший рядок списку локацій відкриває форму редагування за її id. */
async function openFirstLocation(page: Page): Promise<void> {
  await page.goto('/locations');
  await page.getByRole('link', { name: 'Редагувати' }).first().click();
  await expect(page).toHaveURL(/\/locations\/[^/]+$/);
}

test.describe('§1 location detail info blocks (T-4525a)', () => {
  test('header shows the status badge and the info blocks are present', async ({ page }) => {
    await loginAsAdmin(page);
    await openFirstLocation(page);

    // Шапка: статус бейджем (Активна/Неактивна) — §1.2.
    await expect(page.getByText(/^(Активна|Неактивна)$/)).toBeVisible();

    // Інфо-блоки, які збирає слайс.
    await expect(page.getByText('Особливі дати')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Зберегти години' })).toBeVisible();
  });
});
