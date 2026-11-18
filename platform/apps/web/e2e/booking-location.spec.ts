// E2E кроку 1 флоу запису з підміненою геолокацією (web-screens §1, фаза 9+).
// Реальний ланцюжок: useGeolocation → GET /locations/nearest → API (:13000) → БД.
// Порядок — радіус-логіка use case (50 км), не зовнішній Nominatim (бейдж — м'яка).
// Передумови: web (:3001) + API (:13000); БД засіяна (prisma db seed). `pnpm e2e`.
import { test, expect } from '@playwright/test';
import { SEED } from './seed-ids';

const KYIV_CENTER = { latitude: 50.4501, longitude: 30.5234 };
const PODIL = { latitude: 50.4649, longitude: 30.5171 }; // ~1.7 км від центру
const LVIV = { latitude: 49.8397, longitude: 24.0297 }; // ~460 км від Києва

/** Контекст браузера з геолокацією (DRY для чотирьох сценаріїв). */
const geoContext = (browser: import('@playwright/test').Browser, geo: typeof KYIV_CENTER | null) =>
  // prettier-ignore
  browser.newContext(geo ? { permissions: ['geolocation'], geolocation: geo } : { permissions: [] });

test.describe('Booking flow — крок «Локація» з геолокацією', () => {
  test('геолокація дозволена: найближча локація перша, з бейджем відстані', async ({ browser }) => {
    // prettier-ignore
    const context = await geoContext(browser, KYIV_CENTER);
    const page = await context.newPage();
    await page.goto('/booking');

    const cards = page.locator('h3', { hasText: /FADE/ });
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });

    // Київські локації в межах 50 км: обидві видно; Львів (~460 км) — за радіусом
    // і його місто не збігається → клієнт бачить лише київські (2 локації).
    await expect(page.getByText('FADE Podil')).toBeVisible();
    await expect(page.getByText('FADE Obolon')).toBeVisible();
    await expect(page.getByText('FADE Lviv')).toHaveCount(0);

    // Порядок: Podil (~1.7 км) ближче за Obolon (~5.7 км).
    const names = await cards.allTextContents();
    expect(names.indexOf('FADE Podil')).toBeLessThan(names.indexOf('FADE Obolon'));

    // Бейдж відстані біля найближчої локації (з formatDistance).
    await expect(page.locator('.cursor-pointer').first()).toContainText(/км|менше 1 км/);

    // Банер міста: API резолвить місто через Nominatim; якщо зовнішній сервіс
    // недоступний — список залишається радіус-сортованим, тому перевірка м'яка.
    const cityBadge = page.getByText(/Ваше місто:/);
    if (await cityBadge.isVisible().catch(() => false)) {
      await expect(cityBadge).toContainText('Київ');
    }
    await context.close();
  });

  // prettier-ignore
  test('геолокація в іншому місті (Львів): бачить тільки львівську локацію', async ({ browser }) => {
    const context = await geoContext(browser, LVIV);
    const page = await context.newPage();
    await page.goto('/booking');

    await expect(page.getByText('FADE Lviv')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('FADE Podil')).toHaveCount(0);
    await expect(page.getByText('FADE Obolon')).toHaveCount(0);
    await context.close();
  });

  // prettier-ignore
  test('геолокація відхилена: банер-повідомлення і повний список без блокування', async ({ browser }) => {
    const context = await geoContext(browser, null);
    const page = await context.newPage();
    await page.goto('/booking');

    // Відмова → банер + звичайний список усіх активних локацій.
    // prettier-ignore
    await expect(page.getByText('Геолокацію заборонено — покажемо всі локації списком.')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('FADE Podil')).toBeVisible();
    await expect(page.getByText('FADE Obolon')).toBeVisible();
    await expect(page.getByText('FADE Lviv')).toBeVisible();
    await context.close();
  });

  test('вибір локації переводить на крок 2 (сервіси підтягуються з API)', async ({ browser }) => {
    const context = await geoContext(browser, PODIL);
    const page = await context.newPage();
    await page.goto('/booking');

    // Вибір локації через стабільний testid (id сіда, не текст).
    await page.getByTestId(`location-card-${SEED.locations.podil.id}`).click();
    // Крок 2: завантажується каталог послуг з реального API (сід: Haircut тощо).
    // prettier-ignore
    await expect(page.getByRole('heading', { name: /Оберіть послугу|послуг/i })).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  // prettier-ignore
  test('прямий вибір барбера за фіксованим id (без гео): список барберів API', async ({ request }) => {
    // Id-орієнтована перевірка контракту: API віддає саме фіксовані id сіда.
    const res = await request.get(`/booking/barbers/${SEED.locations.podil.id}`);
    expect(res.status()).toBe(200);
    const barbers = (await res.json()) as Array<{ id: string; name: string }>;
    const ids = barbers.map((b) => b.id);
    expect(ids).toContain(SEED.barbers.oleh.id);
    expect(ids).toContain(SEED.barbers.taras.id);
  });
});
