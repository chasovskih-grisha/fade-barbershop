// PrismaDevicePushTokens — читач push-токенів для доставки (T-4422).
// Читає таблицю identity (PushToken) напряму, як PrismaUserEmails і
// PrismaClientContacts: notifications — контекст доставки, тому володіє
// запитами доставки, а identity — записами. Токен «дозволений», якщо рядок
// не revoke і його сесія ще активна (revoke сесії глушить канал пристрою).

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { DevicePushTokens } from '../application/push-ports';

@Injectable()
export class PrismaDevicePushTokens implements DevicePushTokens {
  constructor(private readonly prisma: PrismaService) {}

  async findOtherDeviceTokens(input: {
    userId: string;
    exceptSessionId: string;
  }): Promise<string[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId: input.userId,
        revokedAt: null,
        channel: { not: 'admin' },
        id: { not: input.exceptSessionId },
      },
      select: { id: true },
    });
    if (sessions.length === 0) return [];
    const rows = await this.prisma.pushToken.findMany({
      where: {
        userId: input.userId,
        revokedAt: null,
        sessionId: { in: sessions.map((session) => session.id) },
      },
      select: { token: true },
    });
    return rows.map((row) => row.token);
  }

  async findTokensByUserId(userId: string): Promise<string[]> {
    const rows = await this.prisma.pushToken.findMany({
      where: { userId, revokedAt: null },
      select: { token: true },
    });
    return rows.map((row) => row.token);
  }
}
