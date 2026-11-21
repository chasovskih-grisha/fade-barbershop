/* eslint-disable max-lines -- cohesive module (113 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4559: HTTP-поверхня керованої черги очікування (адмінка).
// Окремий контролер від `waitlist.controller.ts` (T-170, Prisma-сервіс), щоб
// новий слайс не залежав від persistence-шару, який ще не має таблиць.
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ManageWaitlistService } from './manage-waitlist.use-case';
import type { WaitlistAdminAction } from '../domain/waitlist-admin';
import type { FreedSlot, WaitlistEntryData } from '../domain/waitlist-queue';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message.includes('not found')) {
    throw new NotFoundException(error.message);
  }
  throw new BadRequestException(error instanceof Error ? error.message : String(error));
}

@Controller('admin/waitlist')
export class AdminWaitlistController {
  constructor(private readonly waitlist: ManageWaitlistService) {}

  /** Черга з пріоритетами (найвищий — першим). */
  @Get('queue')
  @HttpCode(HttpStatus.OK)
  async queue(@Query('locationId') locationId?: string) {
    return this.waitlist.queue(locationId);
  }

  /** Реєстрація заявки в керованій черзі (клієнт або бекфіл). */
  @Post('entries')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: WaitlistEntryData) {
    try {
      return await this.waitlist.register(body);
    } catch (error) {
      mapError(error);
    }
  }

  /** Ручна дія адміна: promote/demote/pause/resume/transfer. */
  @Post('entries/:id/actions')
  @HttpCode(HttpStatus.OK)
  async action(
    @Param('id') id: string,
    @Body()
    body: {
      action: WaitlistAdminAction;
      by: string;
      reason: string;
      targetLocationId?: string;
    }
  ) {
    try {
      return await this.waitlist.adminAction(id, body.action, {
        by: body.by,
        reason: body.reason,
        ...(body.targetLocationId ? { targetLocationId: body.targetLocationId } : {}),
      });
    } catch (error) {
      mapError(error);
    }
  }

  /** Клієнт скасовує очікування; `releasedHold` — чи звільнився слот. */
  @Post('entries/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @Body() body: { by: string; reason?: string }) {
    try {
      return await this.waitlist.cancel(id, body);
    } catch (error) {
      mapError(error);
    }
  }

  /**
   * Каскад пропозицій на звільнений слот (overbooking-lite, ліміт 3).
   * `now` (ISO) — момент планування для планувальника/реплею.
   */
  @Post('offers/cascade')
  @HttpCode(HttpStatus.OK)
  async cascade(@Body() body: { slot: FreedSlot; count?: number; now?: string }) {
    try {
      const now = body.now === undefined ? new Date() : new Date(body.now);
      if (Number.isNaN(now.getTime())) throw new Error('Invalid now timestamp');
      return await this.waitlist.planOffers(body.slot, {
        now,
        ...(body.count === undefined ? {} : { count: body.count }),
      });
    } catch (error) {
      mapError(error);
    }
  }

  /**
   * Таймер: прострочені пропозиції закриваються, наступні отримують слот.
   * `now` (ISO) дозволяє планувальнику/реплею передати момент перевірки;
   * без нього береться поточний час.
   */
  @Post('offers/expire')
  @HttpCode(HttpStatus.OK)
  async expire(@Body() body: { slot: FreedSlot; now?: string }) {
    try {
      const now = body.now === undefined ? new Date() : new Date(body.now);
      if (Number.isNaN(now.getTime())) throw new Error('Invalid now timestamp');
      return await this.waitlist.expireAndReoffer(body.slot, now);
    } catch (error) {
      mapError(error);
    }
  }

  /** Найраніший слот у межах вікна клієнта (fuzzy window, ADR 0012). */
  @Post('entries/:id/best-slot')
  @HttpCode(HttpStatus.OK)
  async bestSlot(@Param('id') id: string, @Body() body: { slots: FreedSlot[] }) {
    try {
      return { slot: await this.waitlist.bestSlot(id, body.slots ?? []) };
    } catch (error) {
      mapError(error);
    }
  }

  /** Журнал заявки: каскади, відмова й дії адміна з причинами. */
  @Get('entries/:id/history')
  @HttpCode(HttpStatus.OK)
  async history(@Param('id') id: string) {
    try {
      return { items: await this.waitlist.history(id) };
    } catch (error) {
      mapError(error);
    }
  }
}
