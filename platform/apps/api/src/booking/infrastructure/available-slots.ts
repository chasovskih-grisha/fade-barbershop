/* eslint-disable complexity -- 1 function with inherent domain branching (worst: an existing definition, complexity 11 vs 10); refactor tracked in T-2500f */
// AvailableSlots — слоти /slots (крок сітки з політики локації, T-4522): без вільного барбера або з повними кріслами слот лишається у стрічці disabled, не схований (екран 3).

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { dayOfWeekIndex } from '../../scheduling/domain/day-of-week';
import { SlotRequestDto } from '../dto/slot-request.dto';
import { AvailableSlotDto } from '../dto/available-slot.dto';
import { dayStart, dayWindow, resolveDuration } from './available-slots.request';
import type { AvailableSlotsDeps, SlotContext } from './available-slots-helpers';
import {
  readSlotPolicySnapshot,
  isBeyondHorizon,
  type SlotPolicySnapshot,
} from './available-slots.policy';
import { buildSlotGrid } from './available-slots.grid';
import type { SlotPolicyRow } from '../../scheduling/domain/ports.slot-policy';

export type { AvailableSlotsDeps } from './available-slots-helpers';

export type { SlotPolicySnapshot } from './available-slots.policy';

@Injectable()
export class AvailableSlots {
  constructor(private readonly deps: AvailableSlotsDeps) {}

  async handle(dto: SlotRequestDto): Promise<AvailableSlotDto[]> {
    const { locationId, date, serviceId, barberId, fulfillmentMode } = dto;
    const requestedDate = dayStart(date);
    const dayOfWeek = dayOfWeekIndex(requestedDate);
    const duration = await resolveDuration(
      this.deps,
      fulfillmentMode === undefined
        ? { locationId, serviceId }
        : { locationId, serviceId, fulfillmentMode }
    );
    const location = await this.deps.locationRepo.findById(locationId);
    if (!location?.active) throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    const opening = location.hours;
    const activeBarberIds = new Set(
      (await this.deps.userRepo.listByRole('barber')).filter((b) => b.active).map((b) => b.id)
    );
    const chairs = location.chairs.filter((c) => c.active).length;
    if (chairs === 0) return [];

    const dayEnd = new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000);
    // Один знімок часу на запит: утримання, горизонт і last-minute бачать ту саму мить.
    const now = this.deps.clock.now();
    const allBookings = await this.deps.bookingRepo.findAllOverlaps(requestedDate, dayEnd);
    // T-4619a: прострочене/скасоване утримання звільняє крісло одразу.
    const released = this.deps.depositHolds
      ? await this.deps.depositHolds.releasedAppointmentIds(now)
      : new Set<string>();
    const barberBookings = released.size
      ? allBookings.filter((booking) => !released.has(booking.id))
      : allBookings;
    const existing = barberBookings.filter((booking) => booking.locationId === locationId);
    const window = dayWindow(opening, dayOfWeek);
    if (!window) return [];

    const selectedSchedule = barberId
      ? await this.deps.scheduleRepo.findByBarberAndLocation(barberId, locationId)
      : null;
    const allSchedules = barberId ? [] : await this.deps.scheduleRepo.listAllByLocation(locationId);
    const assignmentMatrix = await this.deps.assignmentRepo.snapshotForLocation(locationId);
    const policyRow = await this.deps.slotPolicyRepo.forLocation(locationId);
    const policy: SlotPolicySnapshot = readSlotPolicySnapshot(policyRow as SlotPolicyRow | null);
    // Минулі дати не відсікаємо (сумісність зі старою поведінкою): стрічка їх
    // не показує, а от сьогодні й майбутнє підлягають горизонту/last-minute.
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const isPastDate = requestedDate.getTime() < todayStart;

    // Горизонт запису (T-4522): поза вікном політики — слотів немає.
    if (!isPastDate && isBeyondHorizon(requestedDate, now, policy.horizonDays)) return [];

    // Слот без вільного барбера або з повними кріслами лишається у стрічці disabled.
    const ctx: SlotContext = {
      barberId,
      selectedSchedule,
      allSchedules,
      locationId,
      activeBarberIds,
      opening,
      duration,
      assignmentMatrix: assignmentMatrix.matrix,
      serviceId,
    };
    // Сітка кроку/буфер/last-minute — у buildSlotGrid (T-4522).
    return buildSlotGrid({
      ctx,
      policy,
      date,
      dayOfWeek,
      window,
      now,
      isPastDate,
      barberBookings,
      existing,
      chairs,
    });
  }
}
