// AdminBookingConfirmationController — канал підтвердження запису (email/sms)
// як адмін-налаштування: перегляд і зміна без деплою (патерн MNG-ADM-18).
// Охороняється глобальним AdminSessionGuard (APP_GUARD фільтрує /admin/*).

import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaBookingConfirmationSettings } from './prisma-booking-confirmation-settings';
import {
  parseBookingConfirmationSettings,
  type BookingConfirmationSettings,
  type ConfirmationChannel,
} from '../domain/booking-confirmation-settings';

const CHANNELS: readonly ConfirmationChannel[] = ['email', 'sms', 'both', 'none'];

@ApiTags('admin-settings')
@Controller('admin/settings/booking-confirmation')
export class AdminBookingConfirmationController {
  constructor(private readonly settings: PrismaBookingConfirmationSettings) {}

  @Get()
  @ApiOperation({ summary: 'Канал підтвердження запису (email/sms/both/none)' })
  async get(): Promise<BookingConfirmationSettings> {
    return this.settings.get();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Змінити канал підтвердження без деплою' })
  async update(@Body() body: unknown): Promise<BookingConfirmationSettings> {
    const raw = (typeof body === 'object' && body !== null ? body : {}) as { channel?: unknown };
    const channel = CHANNELS.includes(raw.channel as ConfirmationChannel)
      ? (raw.channel as ConfirmationChannel)
      : undefined;
    // PUT приймає { channel }; невідомий/відсутній канал — тримаємо поточний.
    const merged = parseBookingConfirmationSettings(
      channel ? { channel } : await this.settings.get()
    );
    await this.settings.set(merged);
    return merged;
  }
}
