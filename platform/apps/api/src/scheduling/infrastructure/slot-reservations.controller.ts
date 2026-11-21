// Checkout-резервація слота (T-4802): клієнт бере слот на 60 с перед оплатою,
// отримує токен і передає його в POST /booking/bookings. Без Redis у деві
// працює in-memory адаптер — контракт той самий.
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SlotLockedError, slotLockKey } from '../domain/slot-reservation';
import type { SlotReservations } from '../application/slot-reservations.service';

export interface ReserveSlotDto {
  locationId: string;
  barberId?: string;
  /** ISO-8601 початок слота — ключ лока будується з нього. */
  start: string;
}

export interface ReleaseSlotDto extends ReserveSlotDto {
  token: string;
}

@ApiTags('booking')
@Controller('booking/slot-reservations')
export class SlotReservationsController {
  constructor(private readonly reservations: SlotReservations) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reserve a slot for 60 seconds during checkout' })
  async reserve(@Body() dto: ReserveSlotDto): Promise<{ token: string; expiresAt: string }> {
    const start = this.startOf(dto);
    try {
      const reservation = await this.reservations.reserve({
        locationId: dto.locationId,
        ...(dto.barberId ? { barberId: dto.barberId } : {}),
        start,
      });
      return { token: reservation.token, expiresAt: reservation.expiresAt.toISOString() };
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Release a slot reservation held by this client' })
  async release(@Body() dto: ReleaseSlotDto): Promise<void> {
    const key = slotLockKey({
      locationId: dto.locationId,
      ...(dto.barberId ? { barberId: dto.barberId } : {}),
      start: this.startOf(dto),
    });
    const released = await this.reservations.releaseByKey(key, dto.token);
    if (!released) throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND);
  }

  private startOf(dto: ReserveSlotDto): Date {
    const start = new Date(dto.start);
    if (Number.isNaN(start.getTime())) {
      throw new HttpException('start must be an ISO date-time', HttpStatus.BAD_REQUEST);
    }
    return start;
  }

  private toHttpError(error: unknown): unknown {
    if (error instanceof SlotLockedError) {
      return new HttpException('Slot is being booked by another client', HttpStatus.CONFLICT);
    }
    return error;
  }
}
