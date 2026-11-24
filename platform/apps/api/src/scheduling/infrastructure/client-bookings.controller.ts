/* eslint-disable max-lines -- client booking endpoints keep validation and slot locks together; split tracked in T-2500f */
// Клієнтське підтвердження запису (T-041, екран 5 флоу): перший споживач
// життєвого циклу Appointment з клієнтського боку. Той самий use case
// BookAppointment, що й в адмінки — валідації слота, снепшоти і подія booked
// спільні; контролер примусово ставить source 'web' (ANL-004), бо клієнтський
// шлях не повинен мати змоги видати себе за інший канал.
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  HttpException,
  Inject,
  Post,
  Req,
} from '@nestjs/common';

/** T-4619b: дедлайн утримання + серверний час для зсуву годинника клієнта. */
type DepositPayload = {
  amount: number;
  expiresAt: string;
  serverNow: string;
  resumeToken: string;
};
import { ApiTags } from '@nestjs/swagger';
import { BookAppointment } from '../application/book-appointment.use-case';
import { BookingConflictError } from '../domain/booking';
import { prepareService } from '../application/service-preparation';
import { dayOfWeekFor } from '../domain/day-of-week';
import { TimeSlotData } from '../domain/slot-validator';
import type { OpeningHours } from '../../locations/domain/opening-hours';
import type { ClientBookingDto } from '../dto/client-booking.dto';
import type { ServicePreparation } from '../dto/book-slot.dto';
import type { Request } from 'express';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SlotReservations } from '../application/slot-reservations.service';
import type { HeldSlot } from '../application/slot-lock.ports';
import {
  ReservationInvalidError,
  SlotLockedError,
  slotLockKey,
} from '../domain/slot-reservation';
import { webClientId } from './client-web-session';
import { OnlineBookingBlockedError } from '../../booking/policy/evaluate-online-booking';
import { assertOnlinePolicyAllowed } from './client-online-policy';
import type { ClientBookingsDeps } from './client-bookings.deps';
import { depositResumeToken } from '../../shared/deposit-resume-token';

/** Токен зібраних залежностей клієнтського підтвердження (провайдер у SchedulingModule). */
export const CLIENT_BOOKINGS_IO = Symbol('CLIENT_BOOKINGS_IO');



@ApiTags('booking')
@Controller('booking/bookings')
export class ClientBookingsController {
  constructor(
    @Inject(CLIENT_BOOKINGS_IO) private readonly deps: ClientBookingsDeps,
    private readonly prisma: PrismaService,
    private readonly reservations: SlotReservations
  ) {}

  /** Екран 5 флоу: клієнт підтверджує запис — той самий use case, що й адмін. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: ClientBookingDto,
    @Req() req: Request
  ): Promise<{ id: string; deposit?: DepositPayload }> {
    const location = await this.deps.locationRepo.findById(dto.locationId);
    if (!location?.active) throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    const prepared = await prepareService(this.deps.services, dto);
    // prettier-ignore
    const slot: TimeSlotData = { date: dto.date, dayOfWeek: dayOfWeekFor(dto.date), start: dto.start, end: dto.end };
    const held = await this.lockSlot(dto);
    try {
      // Джерело примусово 'web': клієнтський канал не підмінюєш з DTO (ANL-004).
      // prettier-ignore
      const clientId = dto.clientId ?? (await webClientId(req, this.prisma, false)) ?? undefined;
      await assertOnlinePolicyAllowed(this.deps.onlineBooking, dto, clientId);
      const booked = { ...dto, ...(clientId ? { clientId } : {}) };
      const booking = await this.buildHandler(prepared, location.hours, booked).execute(
        dto.barberId ?? '',
        dto.locationId,
        slot
      );
      return {
        id: booking.id,
        ...(await this.depositHoldOf(booking)),
      };
    } catch (e) {
      throw this.toHttpError(e);
    } finally {
      await this.releaseSlot(held);
    }
  }
  /**
   * T-4619b: дедлайн береться з фактичного утримання, а не з клієнтської
   * константи 15 хвилин. Без утримання (безкоштовний візит, нульовий депозит)
   * клієнт не бачить платіжного кроку.
   */
  private async depositHoldOf(booking: {
    id: string;
    deposit: { amount: number } | null;
  }): Promise<{ deposit?: DepositPayload }> {
    const amount = booking.deposit?.amount ?? 0;
    if (amount <= 0 || !this.deps.depositHolds?.find) return {};
    const hold = await this.deps.depositHolds.find(booking.id);
    if (!hold) return {};
    return {
      deposit: {
        amount,
        expiresAt: hold.expiresAt.toISOString(),
        serverNow: new Date().toISOString(),
        resumeToken: depositResumeToken(booking.id),
      },
    };
  }

  /** Checkout-резервація (T-4802): свій токен перевіряємо, інакше беремо лок. */
  private async lockSlot(dto: ClientBookingDto): Promise<HeldSlot> {
    // prettier-ignore
    const target = { locationId: dto.locationId, ...(dto.barberId ? { barberId: dto.barberId } : {}), start: new Date(`${dto.date}T${dto.start}`) };
    if (!dto.reservationToken) return { ephemeral: await this.reservations.reserve(target) };
    const key = slotLockKey(target);
    await this.reservations.assertHeldBy(key, dto.reservationToken);
    return { reserved: { key, token: dto.reservationToken } };
  }
  private async releaseSlot(held: HeldSlot): Promise<void> {
    if (held.ephemeral) await this.reservations.release(held.ephemeral);
    else if (held.reserved) await this.reservations.releaseByKey(held.reserved.key, held.reserved.token);
  }

  /** Плаский мапінг помилок домену → HTTP (спільна семантика з адмінським). */
  // prettier-ignore
  private toHttpError(e: unknown): unknown {
    if (e instanceof BookingConflictError) return new HttpException('No free chairs for this slot', HttpStatus.CONFLICT);
    if (e instanceof SlotLockedError) return new HttpException('Slot is being booked by another client', HttpStatus.CONFLICT);
    if (e instanceof ReservationInvalidError) return new HttpException(e.message, HttpStatus.GONE);
    // prettier-ignore
    if (e instanceof OnlineBookingBlockedError) return new HttpException({ code: 'BOOKING_BLOCKED', blocks: e.blocks }, HttpStatus.CONFLICT);
    if (e instanceof Error && e.name === 'InvalidSlotError') return new HttpException(e.message, HttpStatus.BAD_REQUEST);
    return e;
  }

  /** Збір BookAppointment: депси + origin web (опційний clientId) + референс. */
  // prettier-ignore
  private buildHandler(prepared: ServicePreparation, hours: OpeningHours, dto: ClientBookingDto): BookAppointment {
    const d = this.deps;
    // prettier-ignore
    return new BookAppointment({ bookingRepo: d.bookingRepo, scheduleRepo: d.scheduleRepo, openingHours: hours, serviceDuration: prepared.duration, appointmentRepo: d.appointmentRepo, depositPolicy: d.depositPolicy, ...(d.dayOffs ? { dayOffs: d.dayOffs } : {}), ...(d.surge ? { surge: d.surge } : {}), ...(d.depositHolds ? { depositHolds: d.depositHolds } : {}), ...(d.unavailable ? { unavailable: d.unavailable } : {}), ...(prepared.snapshot ? { serviceSnapshot: prepared.snapshot } : {}), ...(dto.reference ? { reference: dto.reference } : {}), origin: { source: 'web', ...(dto.clientId ? { clientId: dto.clientId } : {}) } });
  }
}
