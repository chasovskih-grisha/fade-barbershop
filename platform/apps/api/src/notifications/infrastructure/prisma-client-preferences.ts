// Prisma-адаптер налаштувань сповіщень клієнта (T-3100/T-4462)
import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class PrismaClientPreferences {
  constructor(private readonly prisma: PrismaService) {}

  async isOptedOut(clientId: string): Promise<boolean> {
    try {
      const pref = await this.prisma.clientNotificationPreference.findUnique({
        where: { clientId },
      });
      if (!pref) return false;
      return pref.loyaltyOptOut || (!pref.smsEnabled && !pref.pushEnabled && !pref.emailEnabled);
    } catch {
      return false;
    }
  }

  async getPreferences(clientId: string) {
    const pref = await this.prisma.clientNotificationPreference.findUnique({
      where: { clientId },
    });
    if (!pref) {
      return {
        clientId,
        smsEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
        loyaltyOptOut: false,
        reminderOptOut: false,
      };
    }
    return pref;
  }

  async updatePreferences(
    clientId: string,
    data: {
      smsEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      loyaltyOptOut?: boolean;
      reminderOptOut?: boolean;
    },
  ) {
    return this.prisma.clientNotificationPreference.upsert({
      where: { clientId },
      create: {
        id: uuidv7(),
        clientId,
        smsEnabled: data.smsEnabled ?? true,
        emailEnabled: data.emailEnabled ?? true,
        pushEnabled: data.pushEnabled ?? true,
        loyaltyOptOut: data.loyaltyOptOut ?? false,
        reminderOptOut: data.reminderOptOut ?? false,
      },
      update: {
        ...(data.smsEnabled !== undefined && { smsEnabled: data.smsEnabled }),
        ...(data.emailEnabled !== undefined && { emailEnabled: data.emailEnabled }),
        ...(data.pushEnabled !== undefined && { pushEnabled: data.pushEnabled }),
        ...(data.loyaltyOptOut !== undefined && { loyaltyOptOut: data.loyaltyOptOut }),
        ...(data.reminderOptOut !== undefined && { reminderOptOut: data.reminderOptOut }),
      },
    });
  }
}
