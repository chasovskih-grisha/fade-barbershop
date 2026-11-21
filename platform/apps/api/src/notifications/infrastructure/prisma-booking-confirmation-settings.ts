// Prisma-адаптер BookingConfirmationSettingsPort на AppSetting (патерн
// PrismaGeocoderSettings). Пошкодений/неповний JSON деградує до дефолту,
// ніколи не кидає. Коротке кешування: зміна з адмінки підхоплюється
// протягом секунди, а поллер не платить зайвим запитом за кожен тик.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  DEFAULT_BOOKING_CONFIRMATION,
  SETTING_KEY,
  parseBookingConfirmationSettings,
  type BookingConfirmationSettings,
  type BookingConfirmationSettingsPort,
} from '../domain/booking-confirmation-settings';

const READ_CACHE_MS = 1000;

@Injectable()
export class PrismaBookingConfirmationSettings implements BookingConfirmationSettingsPort {
  private cachedAt = 0;
  private cached: BookingConfirmationSettings = DEFAULT_BOOKING_CONFIRMATION;

  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<BookingConfirmationSettings> {
    const now = Date.now();
    if (now - this.cachedAt < READ_CACHE_MS) return this.cached;
    try {
      const row = await this.prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
      this.cached = parseBookingConfirmationSettings(row?.value ?? null);
    } catch {
      this.cached = DEFAULT_BOOKING_CONFIRMATION; // БД тимчасово недоступна — дефолт
    }
    this.cachedAt = now;
    return this.cached;
  }

  /** Запис (адмін-ендпоінт). */
  async set(settings: BookingConfirmationSettings): Promise<void> {
    await this.prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: settings as unknown as object },
      update: { value: settings as unknown as object },
    });
    this.cached = settings;
    this.cachedAt = Date.now();
  }
}
