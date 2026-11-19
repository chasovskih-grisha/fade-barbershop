// ClientDiscountLevel (T-152, DSC-VIP-01…03): постійна знижка на картці
// клієнта в CRM — відсоток або фіксована сума. Застосовується автоматично
// до всіх записів клієнта; стек з промокодом обмежує калькулятор (DSC-003).
import type { DiscountSource } from './discount-calculator';
import { discountSourceFor, type DiscountValue } from './promo-code';

export interface ClientDiscountLevel {
  clientId: string;
  value: DiscountValue;
  /** Хто і коли змінив рівень (DSC-ADM-03: зміна логується). */
  changedBy?: string;
  changedAt?: Date;
}

/** Джерело VIP-знижки або `undefined`, якщо рівня немає (0% теж). */
export function vipDiscountSource(
  level: ClientDiscountLevel | null | undefined
): DiscountSource | undefined {
  if (!level) return undefined;
  const source = discountSourceFor(`vip_${level.clientId}`, 'vip', level.value);
  if (source.percent !== undefined && source.percent <= 0) return undefined;
  if (source.amount !== undefined && source.amount <= 0) return undefined;
  return source;
}
