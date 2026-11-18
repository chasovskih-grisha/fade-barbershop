// Playwright для адмінки (§6.2 телефонний запис, T-4409/T-046).
// Сервер і API зовнішні: `pnpm e2e:admin` очікує вже запущені admin (:13002),
// API (:13000, docker) і smspit/Mailpit (:19096) — те саме, що для apps/web.

import { defineConfig, devices } from '@playwright/test';

const ADMIN_PORT = process.env.ADMIN_PORT ?? '13002';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000, // OTP доводиться чекати з Mailpit — мережа й ретраї send
  expect: { timeout: 10_000 },
  fullyParallel: false, // один адмін-логін, спільний Mailpit і спільна БД
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: `http://localhost:${ADMIN_PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
});
