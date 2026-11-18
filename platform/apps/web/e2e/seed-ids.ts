// Детерміновані id сід-даних (FADE_SEED_FIXED_IDS=1, `pnpm seed:e2e`).
// Єдине джерело правди для Playwright-спек: тест-дані клієнта не хардкодяться
// в кожній спесі, а імпортуються звідси.
//
// T-4300b: PK доменних моделей — PostgreSQL uuid, тож читабельні ключі
// (`loc_KYY_01`) у БД не проходять. Сид перетворює ключ на стабільний UUID
// (sha1 → 16 байт, version 5) — та сама функція, що seedUuid у
// apps/api/scripts/seed/db.ts, тож id у спеках і в БД збігаються.

import { createHash } from 'node:crypto';

function seedUuid(key: string): string {
  const hex = createHash('sha1').update(key).digest('hex').slice(0, 32).split('');
  hex[12] = '5';
  hex[16] = ((parseInt(hex[16] ?? '0', 16) & 0x3) | 0x8).toString(16);
  const h = hex.join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const SEED = {
  locations: {
    podil: { id: seedUuid('loc_KYY_01'), code: 'KYY-01', name: 'FADE Podil' },
    obolon: { id: seedUuid('loc_KYY_02'), code: 'KYY-02', name: 'FADE Obolon' },
    lviv: { id: seedUuid('loc_LVI_01'), code: 'LVI-01', name: 'FADE Lviv' },
  },
  services: {
    haircut: { id: seedUuid('svc_haircut'), name: 'Haircut' },
    beard: { id: seedUuid('svc_beard'), name: 'Beard trim' },
    combo: { id: seedUuid('svc_father_son'), name: 'Father + son' },
  },
  barbers: {
    oleh: { id: seedUuid('barber_Oleh'), name: 'Oleh' },
    taras: { id: seedUuid('barber_Taras'), name: 'Taras' },
  },
} as const;
