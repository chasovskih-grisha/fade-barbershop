import { Controller, Get, Post, Body, Param, Query, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookingReader } from './booking.reader';
import { AvailableSlots } from './available-slots';
import type { LocationDto } from '../dto/location.dto';
import type { ServiceDto } from '../dto/service.dto';
import type { BarberDto } from '../dto/barber.dto';
import type { SlotRequestDto } from '../dto/slot-request.dto';
import type { AvailableSlotDto } from '../dto/available-slot.dto';
import type { WaitlistEntryDto } from '../dto/waitlist-entry.dto';
import { JoinWaitlistDto, CancelWaitlistDto } from '../dto/waitlist-command.dto';
import { ZodValidationPipe } from '../../shared/pipes/zod-validation.pipe';
import { slotRequestZodSchema } from '../dto/slot-request.zod';
import type { SlotRequestZodDto } from '../dto/slot-request.zod';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(
    private readonly reader: BookingReader,
    private readonly slots: AvailableSlots
  ) {}

  // ---------- Public endpoints ----------

  @Get('locations')
  listLocations(): Promise<LocationDto[]> {
    return this.reader.listLocations();
  }

  @Get('services/:locationId')
  listServices(@Param('locationId') locationId: string): Promise<ServiceDto[]> {
    return this.reader.listServices(locationId);
  }

  // T-4521 крок 2: `?serviceId=` звужує список до барберів, що виконують послугу.
  @Get('barbers/:locationId')
  listBarbers(
    @Param('locationId') locationId: string,
    @Query('serviceId') serviceId?: string
  ): Promise<BarberDto[]> {
    return this.reader.listBarbers(locationId, serviceId);
  }

  @Post('slots')
  @UsePipes(new ZodValidationPipe(slotRequestZodSchema))
  listSlots(@Body() dto: SlotRequestZodDto): Promise<AvailableSlotDto[]> {
    return this.slots.handle(dto as SlotRequestDto);
  }

  // ---------- Waitlist endpoints ----------

  @Post('waitlist/join')
  joinWaitlist(@Body() dto: JoinWaitlistDto): Promise<{ entryId: string; queuePosition: number }> {
    return this.reader.joinWaitlist(dto.locationId, dto.serviceId, dto.barberId);
  }

  @Get('waitlist/position/:entryId')
  getWaitlistPosition(
    @Param('entryId') entryId: string
  ): Promise<{ queuePosition: number; estimatedWaitMinutes: number }> {
    return this.reader.getWaitlistPosition(entryId);
  }

  @Post('waitlist/cancel')
  cancelWaitlist(@Body() dto: CancelWaitlistDto): Promise<{ cancelled: boolean }> {
    return this.reader.cancelWaitlist(dto.entryId);
  }

  @Get('manage/:token')
  manageBookingByToken(@Param('token') token: string): { token: string; action: string } {
    return { token, action: 'confirm_reschedule_cancel' };
  }
}
