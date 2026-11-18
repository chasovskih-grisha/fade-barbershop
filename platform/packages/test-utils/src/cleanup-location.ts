// FK-впорядкований cleanup повного піддерева локації + опційні user-и.
// Єдине джерело правди: жодна сюїта не забуде дочірній рядок
// (outbox/booking/party/price/assignment/window/hours/chair/location/user).
import type { TestDb } from './db-port';

/** Outbox — лише за booking-ID цієї локації: глобальний deleteMany за
 * aggregateType під паралельним бігом видаляв чужі події посеред тесту.
 * Діти локації повні: партія, ціни послуг, призначення, графіки, години,
 * крісла — забутий дочірній рядок = FK-помилка на location.delete. */
export async function cleanupTestLocation(
  prisma: TestDb,
  seed: { id: string },
  userIds: string[] = []
): Promise<void> {
  const bookings = await prisma.booking.findMany({
    where: { locationId: seed.id },
    select: { id: true },
  });
  const aggregateIds = { in: bookings.map((b) => b.id) };
  await prisma.outboxMessage.deleteMany({ where: { aggregateId: aggregateIds } });
  await prisma.appointmentParty.deleteMany({ where: { locationId: seed.id } });
  await prisma.booking.deleteMany({ where: { locationId: seed.id } });
  await prisma.servicePrice.deleteMany({ where: { locationId: seed.id } });
  await prisma.staffAssignment.deleteMany({ where: { locationId: seed.id } });
  await prisma.availabilityWindow.deleteMany({ where: { locationId: seed.id } });
  await prisma.openingHour.deleteMany({ where: { locationId: seed.id } });
  await prisma.chair.deleteMany({ where: { locationId: seed.id } });
  await prisma.location.delete({ where: { id: seed.id } });
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
