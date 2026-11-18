// Каскадна анонімізація PII (T-4805) в одній транзакції. Фінансові рядки
// (платежі, чеки, візити) не чіпаємо — лише PII (ризик задачі T-4805).
import type { PrismaService } from '../../../shared/prisma/prisma.service';
import type { AnonymizationResult, ErasureSubject } from '../application/erasure.ports';

export async function anonymizeSubject(
  prisma: PrismaService,
  input: {
    subject: ErasureSubject;
    replacementPhone: string;
    replacementEmail: string;
    now: Date;
  }
): Promise<AnonymizationResult> {
  const { subject, replacementPhone, replacementEmail, now } = input;
  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: subject.userId },
      data: {
        phone: replacementPhone,
        email: replacementEmail,
        name: null,
        username: null,
        passwordHash: null,
        phoneVerifiedAt: null,
        active: false,
      },
    });
    await tx.clientProfile.updateMany({
      where: { userId: subject.userId },
      data: {
        phone: replacementPhone,
        name: null,
        preferences: [],
        notes: [],
        birthDay: null,
        birthMonth: null,
        vipDiscountPercent: null,
      },
    });
    const sessions = await tx.session.updateMany({
      where: { userId: subject.userId, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.pushToken.updateMany({
      where: { userId: subject.userId, revokedAt: null },
      data: { revokedAt: now },
    });
    const photos = await tx.sourcePhoto.findMany({
      where: { ownerId: subject.userId, deletedAt: null },
      select: { objectKey: true },
    });
    await tx.sourcePhoto.updateMany({
      where: { ownerId: subject.userId, deletedAt: null },
      data: { deletedAt: now, consentRevokedAt: now },
    });
    return {
      anonymizedFields: ['User.phone', 'User.email', 'User.name', 'ClientProfile'],
      sessionsRevoked: sessions.count,
      objectKeys: photos.map((photo) => photo.objectKey),
    };
  });
}
