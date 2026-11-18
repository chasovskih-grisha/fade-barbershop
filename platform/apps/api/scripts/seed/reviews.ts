import { uuidv7 } from '@fade/domain-shared';
import { FIXED_IDS, prisma } from './db';
import { REVIEWS } from './data-reviews';
import { logger } from '../src/shared/seed/seed-logger';

export async function seedReviews() {
  for (const r of REVIEWS) {
    const location = await prisma.location.findUnique({ where: { code: r.locationCode } });
    const barber = await prisma.user.findUnique({ where: { phone: r.barberPhone } });
    const customer = await prisma.user.findUnique({ where: { name: r.authorName } });

    if (!location) {
      logger.log(`review skip: location ${r.locationCode} not found`);
      continue;
    }

    const data = {
      rating: r.rating,
      comment: r.comment,
      authorName: r.authorName,
      locationId: location.id,
      barberId: barber?.id ?? null,
      clientId: customer?.id ?? null,
      status: r.status,
      adminReply: r.adminReply,
      createdAt: r.createdAt,
    };

    const existing = await prisma.review.findUnique({ where: { id: r.id } });
    if (existing) {
      await prisma.review.update({ where: { id: r.id }, data });
      logger.log(`review ${r.id} updated`);
    } else {
      await prisma.review.create({ data: { id: r.id ?? uuidv7(), ...data } });
      logger.log(`review ${r.id} created`);
    }
  }
}
