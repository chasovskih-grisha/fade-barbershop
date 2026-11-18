// Адаптер відписки push (T-080): ClientNotificationPreference.pushEnabled.
// Рядка немає — клієнт ще не змінював налаштувань, push дозволений (дефолт
// схеми true). Помилку читання трактуємо як «дозволено» (як isOptedOut).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { ClientPushPreferences } from '../application/appointment-push-ports';

@Injectable()
export class PrismaClientPushPreferences implements ClientPushPreferences {
  constructor(private readonly prisma: PrismaService) {}

  async isPushEnabled(clientId: string): Promise<boolean> {
    try {
      const pref = await this.prisma.clientNotificationPreference.findUnique({
        where: { clientId },
        select: { pushEnabled: true },
      });
      return pref?.pushEnabled ?? true;
    } catch {
      return true;
    }
  }
}
