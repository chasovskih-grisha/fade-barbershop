import { uuidv7 } from '@fade/domain-shared';
import { prisma } from './db';
import { PROMO_CODES } from './data-promos';
import { logger } from '../src/shared/seed/seed-logger';

export async function seedPromos() {
  for (const p of PROMO_CODES) {
    const data = {
      code: p.code,
      discountPercent: p.discountPercent,
      discountAmount: p.discountAmount,
      minOrderAmount: p.minOrderAmount,
      maxUses: p.maxUses,
      currentUses: p.currentUses,
      validFrom: p.validFrom,
      validUntil: p.validUntil,
      active: p.active,
    };

    const existing = await prisma.promoCode.findUnique({ where: { code: p.code } });
    if (existing) {
      await prisma.promoCode.update({ where: { id: existing.id }, data });
      logger.log(`promo code ${p.code} updated`);
    } else {
      await prisma.promoCode.create({ data: { id: p.id ?? uuidv7(), ...data } });
      logger.log(`promo code ${p.code} created`);
    }
  }
}
