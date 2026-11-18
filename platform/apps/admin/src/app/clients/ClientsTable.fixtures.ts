// Фікстури клієнтів для спеки ClientsTable (T-4606a) — окремий файл (гейт
// max-lines, ADR 0019). «Записати» підставляє `User.id` (`userId`), а не
// `ClientProfile.id` (phone-booking-path): id навмисно різні — у сіді вони
// збігаються, тож живий прогін регресію «підставили профільний id» не показує.
import type { ClientListItem } from './client-list-types';

/** Кнопка «Записати» (окремий кейс на клієнта з VIP-знижкою). */
export const bookable: ClientListItem = {
  id: 'c1',
  userId: 'u1',
  name: 'Олександр',
  phone: '+380501112233',
  visits: 4,
  lastVisit: '2026-10-01T10:00:00.000Z',
  loyaltyVisits: 4,
  vipDiscountPercent: 10,
};

/** Маршрут «Записати» з encoded phone; без візитів — «Останній візит» — «—». */
export const maria: ClientListItem = {
  id: 'c2',
  userId: 'u2',
  name: 'Марія',
  phone: '+380671234567',
  visits: 1,
  lastVisit: null,
  loyaltyVisits: 1,
  vipDiscountPercent: null,
};

/** Клієнт без імені (name: null) — для перевірки «Відкрити». */
export const anonymous: ClientListItem = {
  id: 'c3',
  userId: 'u3',
  name: null,
  phone: '+380509998877',
  visits: 0,
  lastVisit: null,
  loyaltyVisits: 0,
  vipDiscountPercent: null,
};

/** Трійця в «серверному» порядку: таблиця не має її пересортовувати. */
export const sortable: ClientListItem[] = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'Олена',
    phone: '+380501111111',
    visits: 2,
    lastVisit: '2026-09-15T10:00:00.000Z',
    loyaltyVisits: 2,
    vipDiscountPercent: null,
  },
  {
    id: 'c2',
    userId: 'u2',
    name: 'Іван',
    phone: '+380502222222',
    visits: 7,
    lastVisit: '2026-10-02T10:00:00.000Z',
    loyaltyVisits: 7,
    vipDiscountPercent: 15,
  },
  {
    id: 'c3',
    userId: 'u3',
    name: 'Анна',
    phone: '+380503333333',
    visits: 0,
    lastVisit: null,
    loyaltyVisits: 0,
    vipDiscountPercent: null,
  },
];
