// Предикати й компаратор фейка списку клієнтів (T-4606a/T-4606b) — окремо від
// класу (гейти max-lines/complexity, ADR 0019): кожна умова фільтра читається
// окремо, а не як одна довга логічна конструкція. Семантики — ті самі, що в
// Prisma-адаптері (client-list-where.ts).
import type {
  ClientListProfileRow,
  ClientListWhere,
  ProfileOrder,
} from '../application/client-list-reader';

/** Рядок Booking у пам'яті: статус і ціна — для зведення (T-4606b). */
export interface MemBooking {
  clientId: string | null;
  locationId: string;
  start: Date;
  /** Статус Appointment; null — рядок без агрегата (як Booking.status у БД). */
  status?: string | null;
  agreedPrice?: number | null;
}

const loyaltyOk = (
  row: ClientListProfileRow,
  status: ClientListWhere['loyaltyStatus']
): boolean => {
  if (status === 'active') return row.loyaltyVisitsCount > 0;
  if (status === 'inactive') return row.loyaltyVisitsCount === 0;
  return true;
};

/** Членство у локації: Booking.clientId зберігає `id` АБО `userId` профілю. */
const keysOk = (row: ClientListProfileRow, keys?: string[]): boolean =>
  !keys || keys.includes(row.id) || keys.includes(row.userId);

const searchOk = (row: ClientListProfileRow, where: ClientListWhere): boolean => {
  const branches: boolean[] = [];
  if (where.search)
    branches.push((row.name ?? '').toLowerCase().includes(where.search.toLowerCase()));
  if (where.phoneSearch) branches.push(row.phone.includes(where.phoneSearch));
  return branches.length === 0 || branches.some(Boolean);
};

/** Умови where: лояльність, члени локації, пошук — разом. */
export const matches = (row: ClientListProfileRow, where: ClientListWhere): boolean =>
  loyaltyOk(row, where.loyaltyStatus) && keysOk(row, where.clientKeys) && searchOk(row, where);

/** Значення колонки профілю для сортування. */
export const profileValue = (
  row: ClientListProfileRow,
  key: ProfileOrder['key']
): string | number | null =>
  key === 'name'
    ? row.name
    : key === 'phone'
      ? row.phone
      : key === 'loyalty'
        ? row.loyaltyVisitsCount
        : row.vipDiscountPercent;

/** Порівняння рядків: null завжди наприкінці, незалежно від напряму. */
export function compareRows(
  a: ClientListProfileRow,
  b: ClientListProfileRow,
  order: ProfileOrder
): number {
  const av = profileValue(a, order.key);
  const bv = profileValue(b, order.key);
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  const diff =
    typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv));
  return (order.dir === 'asc' ? 1 : -1) * diff;
}
