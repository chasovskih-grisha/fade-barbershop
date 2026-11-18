// ClientPreferencesController — керування налаштуваннями сповіщень клієнта (T-3100)
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaClientPreferences } from './prisma-client-preferences';

@ApiTags('notifications-preferences')
@Controller('client/notifications/preferences')
export class ClientPreferencesController {
  constructor(private readonly preferences: PrismaClientPreferences) {}

  @Get(':clientId')
  @ApiOperation({ summary: 'Отримати налаштування сповіщень клієнта' })
  async get(@Param('clientId') clientId: string) {
    return this.preferences.getPreferences(clientId);
  }

  @Put(':clientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Оновити налаштування сповіщень клієнта' })
  async update(
    @Param('clientId') clientId: string,
    @Body()
    body: {
      smsEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      loyaltyOptOut?: boolean;
      reminderOptOut?: boolean;
    },
  ) {
    return this.preferences.updatePreferences(clientId, body);
  }
}
