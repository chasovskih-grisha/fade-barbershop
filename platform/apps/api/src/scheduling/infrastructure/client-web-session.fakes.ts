// Спільний фейк Prisma для спек клієнтських маршрутів візиту (T-043): web-сесія
// за cookie fadoidx + перевірка власності візиту (booking.findFirst). Замінює
// однакові копії prismaFor у спеках reference і cancel/reschedule (DRY).
import { hashToken } from '../../identity/domain/otp-code';

/** Сирий токен web-сесії, який кладуть у cookie fadoidx у цих спеках. */
export const WEB_SESSION_TOKEN = 'web-session-token';

/** Prisma-фейк: сесія web за токеном; `owns` — чи бачить booking свій візит. */
export function prismaForClient(owns: boolean) {
  return {
    session: {
      findUnique: jest.fn(async ({ where }: { where: { tokenHash: string } }) =>
        where.tokenHash === hashToken(WEB_SESSION_TOKEN)
          ? { userId: 'user-1', channel: 'web', revokedAt: null }
          : null
      ),
    },
    booking: {
      findFirst: jest.fn(async () => (owns ? { id: 'bk-1' } : null)),
    },
  };
}
