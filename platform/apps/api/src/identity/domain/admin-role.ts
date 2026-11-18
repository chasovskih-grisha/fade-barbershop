// AdminRole — підролі адмінки (T-2400a, ADR 0027). Відрізняється від Role
// (client | barber | admin): тут лише рівні доступу всередині адмінки. Модель
// даних — AdminRole; джерело правди для початкових ролей — цей константний кіт.

export const ADMIN_ROLE_KEYS = ['super-admin', 'manager', 'barber'] as const;
export type AdminRoleKey = (typeof ADMIN_ROLE_KEYS)[number];

/** Секції адмінки, доступ до яких роздають ролі (admin-screens §0–5). */
export const ADMIN_SECTIONS = [
  'locations',
  'barbers',
  'services',
  'schedule',
  'clients',
  'analytics',
  'settings',
  'roles',
] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number];

/** Секції, які надаються глобально (не залежно від локації).
 *  AnL-ADM-01…06: analytics, roles — охоплюєють всю мережу.
 */
export const GLOBAL_SECTIONS: readonly AdminSection[] = ['analytics', 'roles'] as const;

/** Початковий кіт ролей (seeder); редагуються лише в коді, не в рантаймі. */
export const DEFAULT_ADMIN_ROLES: readonly AdminRoleDefinition[] = [
  {
    key: 'super-admin',
    name: 'Супер-адмін',
    description: 'Повний доступ до всіх розділів адмінки.',
    permissions: ['*'],
    priority: 100,
    locationId: null,
  },
  {
    key: 'manager',
    name: 'Менеджер',
    description: 'Операційні розділи без керування ролями і налаштуваннями.',
    permissions: ['locations', 'barbers', 'services', 'schedule', 'clients', 'analytics'],
    priority: 50,
    locationId: null, // will be set per manager in DB/seeder for each location
  },
  {
    key: 'barber',
    name: 'Барбер',
    description: 'Лише власний розклад і клієнти.',
    permissions: ['schedule', 'clients'],
    priority: 10,
    locationId: null,
  },
];

export function isAdminRoleKey(value: string): value is AdminRoleKey {
  return (ADMIN_ROLE_KEYS as readonly string[]).includes(value);
}

/** Роль дозволяє секцію, якщо має `*` або саму секцію. */
export function roleAllows(permissions: readonly string[], section: AdminSection): boolean {
  return permissions.includes('*') || permissions.includes(section);
}

/** Перевірка, чи має роль доступ до секції для конкретної локації.
 *  - Спочатку перевіряємо, чи дозволено саму секцію через roleAllows
 *  - Глобальні секції (analytics, roles) — завжди Allow, незалежно від location
 *  - Інші секції — перевіряємо location scoping через roleAllowsLocation
 */
export function roleAllowsSection(
  permissions: readonly string[],
  section: AdminSection,
  locationId: string | null,
  recordLocationId: string | null
): boolean {
  if (!roleAllows(permissions, section)) return false;
  // Глобальні секції (analytics, roles) — завжди Allow, незалежно від location
  if (GLOBAL_SECTIONS.includes(section)) return true;
  // Для інших секцій — перевіряємо location scoping
  return roleAllowsLocation(permissions, locationId, recordLocationId);
}

/** Перевірка, чи має доступ до запису конкретної локації.
 *  - super-admin (locationId === null): завжди Allow для будь-якої локації
 *  - manager з locationId: тільки своя локація
 *  - manager без locationId: глобальний доступ (за замовчуванням для M10)
 *  - інші роль: перевіряємо permissions
 */
export function roleAllowsLocation(
  permissions: readonly string[],
  locationId: string | null,
  recordLocationId: string | null
): boolean {
  // super-admin може все
  if (permissions.includes('*')) return true;
  // manager без locationId — глобальний доступ (за замовчуванням для M10)
  if (locationId === null) return true;
  // manager з конкретним locationId — тільки своя локація
  if (locationId !== null && locationId === recordLocationId) return true;
  // manager з locationId, але запис з іншого — заборонено
  if (locationId !== null && locationId !== recordLocationId) return false;
  // за замовчуванням — заборона
  return false;
}