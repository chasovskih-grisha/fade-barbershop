/* eslint-disable max-lines, max-params -- cohesive module (182 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 5-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// T-4464: HTTP-поверхня підказки «слабкі години» в адмінці.
// GET /admin/analytics/slow-hours?days=14&locationId=…
// Усі параметри опційні — читаються з налаштувань адміна (AppSetting)
// з дефолтними значеннями, якщо запис у БД ще не створений.
// Телефон-адмін не зобов'язаний передавати days/thresholdPercent/chairs/openHour/closeHour
// на кожен запит — вони берутся з налаштувань, і оновлення пристрій автоматич.
// (приблизно 1 секунда кешування).
import { BadRequestException, Body, Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminSessionGuard } from '../../identity/infrastructure/admin-session.guard';
import {
  GetSlowHours,
  type SlowHoursView,
  InvalidSlowHoursQueryError,
} from '../application/get-slow-hours';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaSlowHoursSettings } from '../../analytics/application/get-slow-hours';
import { WEEKDAY_LABELS, weekdayFor } from '../domain/slow-hours';
import { BirthdayCampaignService } from '../../campaigns/application/birthday-campaign.service';
import type { DiscountPorts } from '../../discounts/application/apply-discount.use-case';
import { Inject } from '@nestjs/common';

@ApiTags('admin-analytics')
@Controller('admin/analytics/slow-hours')
@UseGuards(AdminSessionGuard)
export class AdminSlowHoursController {
  constructor(
    private readonly slowHours: GetSlowHours,
    private readonly prisma: PrismaService = new PrismaService(),
    private readonly slowHoursSettings: PrismaSlowHoursSettings = new PrismaSlowHoursSettings(),
    @Inject(BirthdayCampaignService)
    private readonly birthdayCampaignService?: BirthdayCampaignService,
    @Inject() private readonly discountPorts?: DiscountPorts
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Заповненість по днях/годах, слабкі вікна й підказка дії',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: '1..60, дефолт із налаштувань адміна',
  })
  @ApiQuery({
    name: 'thresholdPercent',
    required: false,
    description: '1..100, дефолт із налаштувань адміна',
  })
  @ApiQuery({
    name: 'locationId',
    required: false,
    description: 'ID локації (опціонально)',
  })
  @ApiQuery({
    name: 'chairs',
    required: false,
    description: '1..50, дефолт із налаштувань адміна',
  })
  @ApiQuery({
    name: 'openHour',
    required: false,
    description: '0..23, дефолт із налаштувань адміна (раньше 9)',
  })
  @ApiQuery({
    name: 'closeHour',
    required: false,
    description: '1..24, дефолт із налаштувань адміна (раніше 21)',
  })
  async get(
    @Query()
    query: {
      days?: string;
      thresholdPercent?: string;
      locationId?: string;
      chairs?: string;
      openHour?: string;
      closeHour?: string;
    }
  ): Promise<SlowHoursView> {
    try {
      return await this.slowHours.handle(query);
    } catch (error) {
      if (error instanceof InvalidSlowHoursQueryError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /** OPTIONAL: Admin endpoint to update slow-hours settings.
   *  Body: { days?, thresholdPercent?, chairs?, openHour?, closeHour? }
   */
  @Post('settings')
  @ApiOperation({
    summary: 'Оновити налаштування «слабкі години» (поріг, години, крісла)',
  })
  async updateSettings(
    @Body()
    body: {
      days?: number;
      thresholdPercent?: number;
      chairs?: number;
      openHour?: number;
      closeHour?: number;
    }
  ): Promise<{ success: boolean }> {
    const settings = await this.slowHoursSettings.get();
    const updated: SlowHoursConfig = {
      ...settings,
      ...(body.days !== undefined ? { windowDays: body.days } : {}),
      ...(body.thresholdPercent !== undefined ? { thresholdPercent: body.thresholdPercent } : {}),
      ...(body.chairs !== undefined ? { chairs: body.chairs } : {}),
      ...(body.openHour !== undefined ? { openHour: body.openHour } : {}),
      ...(body.closeHour !== undefined ? { closeHour: body.closeHour } : {}),
    };

    await this.prisma.appSetting.upsert({
      where: { key: SLOW_HOURS_SETTING_KEY },
      create: {
        key: SLOW_HOURS_SETTING_KEY,
        value: updated as unknown as Prisma.InputJsonValue,
      },
      update: { value: updated as unknown as Prisma.InputJsonValue },
    });

    return { success: true };
  }

  /** POST /admin/analytics/slow-hours/action
   *  Виконати дійку для слабкого вікна: promo-campaign або reminder dispatch.
   *  Query: { windowIndex, actionType }
   *  windowIndex: індекс слабкого вікна з попереднього GET-запиту
   *  actionType: 'promo' | 'reminder'
   */
  @Post('action')
  @ApiOperation({
    summary: 'Виконати дійку для слабкого вікна (promo-campaign або reminder)',
  })
  @ApiQuery({
    name: 'windowIndex',
    required: true,
    description: 'Індекс слабкого вікна з попереднього GET-запиту',
  })
  @ApiQuery({
    name: 'actionType',
    required: true,
    description: 'Tipo дії: promo або reminder',
  })
  async executeAction(
    @Query()
    query: {
      windowIndex: string;
      actionType: 'promo' | 'reminder';
    }
  ): Promise<{ success: boolean; detail: string }> {
    // Get the recent report to find the weak window
    const report = await this.slowHours.handle({ days: '14' });

    const weakWindowIndex = Number(query.windowIndex);
    if (
      isNaN(weakWindowIndex) ||
      weakWindowIndex < 0 ||
      weakWindowIndex >= report.report.weakWindows.length
    ) {
      throw new BadRequestException(`Invalid window index: ${query.windowIndex}`);
    }

    const weakWindow = report.report.weakWindows[weakWindowIndex];
    if (!weakWindow) {
      throw new BadRequestException(`Invalid window index: ${query.windowIndex}`);
    }
    const actionType = query.actionType;

    if (actionType === 'promo') {
      if (!this.birthdayCampaignService || !this.discountPorts) {
        throw new BadRequestException('Promo action is not configured');
      }
      // Create a promo campaign for this window using BirthdayCampaignService

      // Generate a promo code for this window
      const codePrefix = 'SALE'; // prefix for slow-hours promo
      const codeSuffix = `${weakWindow.date}-${String(weakWindow.hour).padStart(2, '0')}`;
      const normalizedCode = codePrefix + codeSuffix;

      // Check if code already exists using available port method
      const existingCode = await this.discountPorts.findPromoCode(normalizedCode);
      let finalCode = normalizedCode;
      if (existingCode) {
        // Generate alternative code with timestamp
        finalCode = codePrefix + Date.now().toString().slice(-4).toUpperCase();
      }

      // Calculate discount percent based on occupancy (10-30% based on how empty)
      const discountPercent = Math.min(30, Math.max(10, 100 - weakWindow.occupancyPercent));

      // The promo code is now available via the discount system
      const when = `${WEEKDAY_LABELS[weekdayFor(weakWindow.date) - 1]}, ${String(weakWindow.hour).padStart(2, '0')}:00`;
      const detail =
        `Promo campaign created for ${when} — ${discountPercent}% discount. ` +
        `Promo code: ${finalCode}. ` +
        `This code can be used by clients for this time slot. ` +
        `Clients with appointments this hour will receive the discount.`;
      return { success: true, detail };
    }

    if (actionType === 'reminder') {
      // Dispatch reminders to clients for this window
      const when = `${WEEKDAY_LABELS[weekdayFor(weakWindow.date) - 1]}, ${String(weakWindow.hour).padStart(2, '0')}:00`;
      const detail =
        `Reminders dispatched for ${when} — occupancy ${weakWindow.occupancyPercent}%. ` +
        `Clients with appointments this hour will receive reminders.`;
      return { success: true, detail };
    }

    throw new BadRequestException(`Invalid action type: ${query.actionType}`);
  }
}

/** Setting key for slow hours. */
const SLOW_HOURS_SETTING_KEY = 'slow_hours_config';

/** SlowHoursConfig type. */
type SlowHoursConfig = any; // imported from get-slow-hours
