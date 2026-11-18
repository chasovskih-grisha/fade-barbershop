// Playwright для флоу запису (apps/web). Сервер і API зовнішні:
// `pnpm e2e` очікує вже запущені web (:3001) і API (:13000, docker) —
// запуск CI описаний у .github/workflows/ci.yml.
// Геолокація підмінюється через context.grantPermissions + setGeolocation:
// реальний ланцюжок useGeolocation → /locations/nearest → Next rewrite → API.

import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = process.env.WEB_PORT ?? '3001';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
});
