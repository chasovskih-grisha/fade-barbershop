// HTTP-поверхня політики онлайн-букінгу (T-4542):
//   GET  /booking/policy            — ефективна політика локації (для фронту)
//   POST /booking/policy/evaluate   — передполітна перевірка дії з причинами
//   PUT  /admin/settings/online-booking-policy — конфіг (locationId=null — глобальний)
// /admin/* охороняє глобальний AdminSessionGuard, як і решта адмін-налаштувань.
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  EvaluateOnlineBooking,
  OnlineBookingBlockedError,
  type BookingAction,
} from './evaluate-online-booking';
import { isValidPolicy, mergePolicy, type OnlineBookingPolicy } from './online-booking-policy';
import { ONLINE_BOOKING_STORE } from './booking-policy.ports';
import type { OnlineBookingStore } from './booking-policy.ports';
import { Inject } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

interface EvaluateBody {
  locationId?: string;
  action?: BookingAction;
  start?: string;
  barberId?: string;
  clientId?: string;
}

@ApiTags('booking')
@Controller('booking/policy')
export class BookingPolicyController {
  constructor(
    private readonly evaluate: EvaluateOnlineBooking,
    @Inject(ONLINE_BOOKING_STORE) private readonly store: OnlineBookingStore
  ) {}

  @Get()
  @ApiOperation({ summary: 'Ефективна політика онлайн-букінгу для локації' })
  async get(@Query('locationId') locationId?: string): Promise<{ policy: OnlineBookingPolicy }> {
    if (!locationId) throw new HttpException('locationId is required', HttpStatus.BAD_REQUEST);
    return { policy: mergePolicy(await this.store.policyFor(locationId)) };
  }

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Чи можна виконати дію онлайн: причини блокування для UI' })
  async check(@Body() body: EvaluateBody): Promise<{
    allowed: boolean;
    policy: OnlineBookingPolicy;
    blocks: { code: string; message: string }[];
  }> {
    if (!body.locationId || !body.start) {
      throw new HttpException('locationId and start are required', HttpStatus.BAD_REQUEST);
    }
    const start = new Date(body.start);
    if (!Number.isFinite(start.getTime()))
      throw new HttpException('Invalid start', HttpStatus.BAD_REQUEST);
    try {
      const result = await this.evaluate.execute({
        locationId: body.locationId,
        action: body.action ?? 'create',
        start,
        ...(body.clientId ? { clientId: body.clientId } : {}),
        ...(body.barberId ? { barberId: body.barberId } : {}),
      });
      return { allowed: result.allowed, policy: result.policy, blocks: result.blocks };
    } catch (error) {
      if (error instanceof OnlineBookingBlockedError) {
        throw new HttpException(
          { code: 'BOOKING_BLOCKED', blocks: error.blocks },
          HttpStatus.CONFLICT
        );
      }
      throw error;
    }
  }
}

@ApiTags('admin-settings')
@Controller('admin/settings/online-booking-policy')
export class AdminOnlineBookingPolicyController {
  constructor(@Inject(ONLINE_BOOKING_STORE) private readonly store: OnlineBookingStore) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Змінити політику онлайн-букінгу локації або глобальну' })
  async update(
    @Query('locationId') locationId?: string,
    @Body() body?: Partial<OnlineBookingPolicy>
  ): Promise<{ policy: OnlineBookingPolicy }> {
    const policy = mergePolicy(body ?? {});
    if (!isValidPolicy(policy)) {
      throw new HttpException('Invalid online booking policy', HttpStatus.BAD_REQUEST);
    }
    await this.store.upsert(locationId ?? null, policy);
    return { policy };
  }
}
