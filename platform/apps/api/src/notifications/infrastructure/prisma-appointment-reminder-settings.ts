// Prisma-адаптер налаштувань нагадування на AppSetting (патерн
// PrismaBookingConfirmationSettings). Пошкоджений JSON деградує до дефолту
// і ніколи не кидає; коротке кешування — зміна з адмінки підхоплюється за
// секунду, а поллер не платить запитом за кожен тік.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { DEFAULT_APPOINTMENT_REMINDER, REMINDER_SETTING_KEY, parseAppointmentReminderSettings, type AppointmentReminderSettings } from '../domain/appointment-reminder-settings';

const READ_CACHE_MS = 1000;

@Injectable()
export class PrismaAppointmentReminderSettings {
  private cachedAt = 0;
  private cached: AppointmentReminderSettings = DEFAULT_APPOINTMENT_REMINDER;

  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<AppointmentReminderSettings> {
    const now = Date.now();
    if (now - this.cachedAt < READ_CACHE_MS) return this.cached;
    try {
      const row = await this.prisma.appSetting.findUnique({ where: { key: REMINDER_SETTING_KEY } });
      this.cached = parseAppointmentReminderSettings(row?.value ?? null);
    } catch {
      this.cached = DEFAULT_APPOINTMENT_REMINDER; // БД тимчасово недоступна
    }
    this.cachedAt = now;
    return this.cached;
  }

  /** Запис (адмін-ендпоінт). */
  async set(settings: AppointmentReminderSettings): Promise<void> {
    await this.prisma.appSetting.upsert({
      where: { key: REMINDER_SETTING_KEY },
      create: { key: REMINDER_SETTING_KEY, value: settings as unknown as object },
      update: { value: settings as unknown as object },
    });
    this.cached = settings;
    this.cachedAt = Date.now();
  }
}
