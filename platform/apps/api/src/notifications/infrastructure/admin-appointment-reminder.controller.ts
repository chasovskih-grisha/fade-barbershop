// AdminAppointmentReminderController — канал і час у допуску нагадування
// як адмін-налаштування (патерн MNG-ADM-18, як в booking-confirmation):
// перегляд і зміна без деплою. Охороняється AdminSessionGuard (APP_GUARD).

import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaAppointmentReminderSettings } from './prisma-appointment-reminder-settings';
import { parseAppointmentReminderSettings, type AppointmentReminderSettings, type ReminderChannel } from '../domain/appointment-reminder-settings';

const CHANNELS: readonly ReminderChannel[] = ['sms', 'none'];

@ApiTags('admin-settings')
@Controller('admin/settings/appointment-reminder')
export class AdminAppointmentReminderController {
  constructor(private readonly settings: PrismaAppointmentReminderSettings) {}

  @Get()
  @ApiOperation({ summary: 'Нагадування про візит: канал і час у допуску' })
  async get(): Promise<AppointmentReminderSettings> {
    return this.settings.get();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Змінити нагадування про візит без деплою' })
  async update(@Body() body: unknown): Promise<AppointmentReminderSettings> {
    const raw = (typeof body === 'object' && body !== null ? body : {}) as {
      channel?: unknown;
      leadMinutes?: unknown;
    };
    // PUT приймає { channel?, leadMinutes? }; невідоме/відсутнє — тримаємо поточне.
    const current = await this.settings.get();
    const merged = parseAppointmentReminderSettings({
      channel: CHANNELS.includes(raw.channel as ReminderChannel) ? raw.channel : current.channel,
      leadMinutes: raw.leadMinutes ?? current.leadMinutes,
    });
    await this.settings.set(merged);
    return merged;
  }
}
