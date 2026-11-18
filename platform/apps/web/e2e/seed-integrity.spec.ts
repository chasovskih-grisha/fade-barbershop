// Охоронний тест сід-даних: фіксовані id не «повзли». Падає ПЕРШИМ і з
// зрозумілою причиною, якщо хтось змінив сід (коди/імена/id), а не посеред
// id-залежних сценаріїв флоу. Запуск: `pnpm e2e` (перед booking-location).

import { test, expect } from '@playwright/test';
import { SEED } from './seed-ids';

const API = process.env.LOCATION_API_URL ?? 'http://localhost:13000';

test.describe('Seed integrity (fixed ids for e2e)', () => {
  test('локації мають очікувані коди та фіксовані id', async ({ request }) => {
    const res = await request.get(`${API}/locations`);
    expect(res.status()).toBe(200);
    const locations = (await res.json()) as Array<{ id: string; code: string; name: string }>;

    for (const expected of Object.values(SEED.locations)) {
      const found = locations.find((l) => l.code === expected.code);
      if (!found)
        throw new Error(`локація ${expected.code} відсутня в API — запусти pnpm seed:e2e`);
      expect(found.id).toBe(expected.id);
      expect(found.name).toBe(expected.name);
    }
  });

  test('барбери локації мають фіксовані id', async ({ request }) => {
    const res = await request.get(`${API}/booking/barbers/${SEED.locations.podil.id}`);
    expect(res.status()).toBe(200);
    const barbers = (await res.json()) as Array<{ id: string; name: string; any?: boolean }>;

    expect(barbers[0]).toMatchObject({ any: true });
    for (const expected of Object.values(SEED.barbers)) {
      const found = barbers.find((b) => b.name === expected.name);
      if (!found) throw new Error(`барбер ${expected.name} відсутній — запусти pnpm seed:e2e`);
      expect(found.id).toBe(expected.id);
    }
  });

  test('каталог послуг локації має фіксовані id', async ({ request }) => {
    const res = await request.get(`${API}/booking/services/${SEED.locations.podil.id}`);
    expect(res.status()).toBe(200);
    const services = (await res.json()) as Array<{ id: string; name: string }>;

    for (const expected of Object.values(SEED.services)) {
      const found = services.find((s) => s.name === expected.name);
      if (!found) throw new Error(`послуга ${expected.name} відсутня — запусти pnpm seed:e2e`);
      expect(found.id).toBe(expected.id);
    }
  });
});
