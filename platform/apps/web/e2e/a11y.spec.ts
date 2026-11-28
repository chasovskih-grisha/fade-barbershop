// axe-гейт доступності публічних сторінок (T-4510a): WCAG-поріг — 0
// критичних/серйозних порушень. Дрібні (moderate/minor) не валять прогін,
// інакше гейт тоне в боргу, який виправляє T-3501.
// Запуск: `pnpm e2e:a11y` (потрібні запущені web :3001 і API :13000).

import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = ['/', '/booking', '/services', '/barbers', '/locations'];

const BLOCKING = ['critical', 'serious'];

for (const path of PUBLIC_PAGES) {
  test(`публічна сторінка ${path} без критичних a11y-порушень`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((v) => BLOCKING.includes(v.impact ?? ''));

    expect(
      blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} вузл.`),
      `порушення на ${path}`
    ).toEqual([]);
  });
}

test('кореневий layout оголошує українську мову', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
});
