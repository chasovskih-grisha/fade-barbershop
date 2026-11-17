// Складання `where` профілю для списку клієнтів (T-4606a/T-4606b) — окремо від
// адаптера (гейт max-lines, ADR 0019) і спільно зі зведенням: сторінка й
// підсумки мусять рахувати ОДИН фільтр, інакше цифри на екрані розійдуться.
import type { Prisma } from '@prisma/client';
import type { ClientListWhere } from '../application/client-list-reader';

/** where профілю: пошук (ім'я insensitive ∨ телефон), лояльність, члени локації. */
export function profileWhere(where: ClientListWhere): Prisma.ClientProfileWhereInput {
  const and: Prisma.ClientProfileWhereInput[] = [];
  if (where.loyaltyStatus === 'active') and.push({ loyaltyVisitsCount: { gt: 0 } });
  if (where.loyaltyStatus === 'inactive') and.push({ loyaltyVisitsCount: 0 });
  if (where.clientKeys)
    and.push({ OR: [{ userId: { in: where.clientKeys } }, { id: { in: where.clientKeys } }] });
  const or: Prisma.ClientProfileWhereInput[] = [];
  if (where.search) or.push({ name: { contains: where.search, mode: 'insensitive' } });
  if (where.phoneSearch) or.push({ phone: { contains: where.phoneSearch } });
  if (or.length > 0) and.push({ OR: or });
  return and.length > 0 ? { AND: and } : {};
}
