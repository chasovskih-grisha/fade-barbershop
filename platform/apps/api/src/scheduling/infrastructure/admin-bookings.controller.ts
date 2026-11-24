// prettier-ignore
import { Controller, Post, Body, HttpCode, HttpStatus, HttpException, Inject } from '@nestjs/common';
// prettier-ignore
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { BookAppointment } from '../application/book-appointment.use-case';
import { BookingConflictError } from '../domain/booking';
import { PrismaBookingRepository } from '../infrastructure/prisma-booking.repository';
import { PrismaAvailabilityRepository } from '../infrastructure/prisma-availability.repository';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { TimeSlotData } from '../domain/slot-validator';
import { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';
import type { OpeningHours } from '../../locations/domain/opening-hours';
import type { BookSlotDto, ServicePreparation } from '../dto/book-slot.dto';
import { prepareService } from '../application/service-preparation';
import { dayOfWeekFor } from '../domain/day-of-week';
import type { PrismaDepositPolicySettings } from '../infrastructure/prisma-deposit-policy-settings';

/** Токен зібраних залежностей AdminBookingsController (провайдер у SchedulingModule). */
export const ADMIN_BOOKINGS_IO = Symbol('ADMIN_BOOKINGS_IO');

export interface AdminBookingsDeps {
  bookingRepo: PrismaBookingRepository;
  scheduleRepo: PrismaAvailabilityRepository;
  locationRepo: PrismaLocationRepository;
  services: PrismaServiceRepository;
  appointmentRepo?: import('../domain/appointment-repository').AppointmentRepository;
  depositPolicy: PrismaDepositPolicySettings;
  /** T-4447: вихідні барбера; за відсутності порту перевірки немає. */
  dayOffs?: import('../domain/day-off').DayOffRepository;
  /** T-4619a: утримання крісла під незаплачений депозит. */
  depositHolds?: import('../application/deposit-hold.service').DepositHoldService;
  /** T-4616a: недоступність барбера блокує новий запис. */
  unavailable?: Pick<import('../domain/shift-conflict-ports').BarberUnavailabilityRepository, 'covers'>;
}

/**
 * Admin endpoint for creating bookings.
 * OpeningHours are fetched from the LocationRepository so they reflect the real schedule.
 */
@ApiTags('admin-bookings')
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(@Inject(ADMIN_BOOKINGS_IO) private readonly deps: AdminBookingsDeps) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking (admin)' })
  // prettier-ignore
  @ApiCreatedResponse({
    description: 'Booking created',
    schema: { example: { id: 'booking-123' } },
  })
  @ApiBadRequestResponse({
    description: 'Invalid slot data (format, duration, opening hours, etc.)',
  })
  @ApiConflictResponse({ description: 'No free chairs for the requested slot' })
  @ApiNotFoundResponse({ description: 'Location not found' })
  async create(@Body() dto: BookSlotDto): Promise<{ id: string }> {
    const { locationId, barberId, date, start, end } = dto;
    const dayOfWeek = dayOfWeekFor(date);
    const location = await this.deps.locationRepo.findById(locationId);
    if (!location?.active) throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    const prepared = await this.prepareService(dto);
    const slot: TimeSlotData = { date, dayOfWeek, start, end };
    try {
      // Pass empty string for any‑barber when not provided.
      // prettier-ignore
      const booking = await this.buildHandler(prepared, location.hours, dto).execute(barberId ?? '', locationId, slot);
      return { id: booking.id };
    } catch (e) {
      throw this.toHttpError(e);
    }
  }

  /** Плаский мапінг помилок домену → HTTP (ADR 0019: ignore на пласкому методі). */
  // prettier-ignore
  private toHttpError(e: unknown): unknown {
    if (e instanceof BookingConflictError) return new HttpException('No free chairs for this slot', HttpStatus.CONFLICT);
    if (e instanceof Error && e.name === 'InvalidSlotError') return new HttpException(e.message, HttpStatus.BAD_REQUEST);
    return e;
  }

  /** Збір BookAppointment: депси + опційні снепшоти (послуга/референс/джерело). */
  // prettier-ignore
  private buildHandler(prepared: ServicePreparation, hours: OpeningHours, dto: BookSlotDto): BookAppointment {
    const d = this.deps;
    // prettier-ignore
    return new BookAppointment({ bookingRepo: d.bookingRepo, scheduleRepo: d.scheduleRepo, openingHours: hours, serviceDuration: prepared.duration, ...(d.appointmentRepo ? { appointmentRepo: d.appointmentRepo } : {}), ...(prepared.snapshot ? { serviceSnapshot: prepared.snapshot } : {}), ...(dto.reference ? { reference: dto.reference } : {}), ...(dto.origin ? { origin: dto.origin } : {}), depositPolicy: d.depositPolicy, ...(d.dayOffs ? { dayOffs: d.dayOffs } : {}), ...(d.depositHolds ? { depositHolds: d.depositHolds } : {}), ...(d.unavailable ? { unavailable: d.unavailable } : {}) });
  }

  private prepareService(dto: BookSlotDto): Promise<ServicePreparation> {
    return prepareService(this.deps.services, dto);
  }
}
