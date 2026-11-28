/**
 * Walk-in queue service for T-5024: Automated Barber Station Allocation & Walk-In Queue Balancing
 *
 * Provides intelligent walk-in queue dispatch and station assignment algorithm that
 * balances workload evenly across active barbers, minimizes client wait times, and
 * matches service requests to barber skill specializations.
 *
 * Публічний шлях модуля: типи — walk-in-queue.types.ts, підбір барбера й оцінка
 * очікування — walk-in-queue-assignment.ts.
 */
import { uuidv7 } from '@fade/domain-shared';
import { optimizeShiftBidding } from './shift-bidding-optimizer';
import {
  availableBarbers,
  calculateEstimatedWaitTime,
  findBestBarberForClient,
  getAlternativeBarbers,
} from './walk-in-queue-assignment';
import type { ShiftConflict } from './shift-bidding-types';
import type { QueueEntry, WalkInCheckInRequest, WalkInQueueResult } from './walk-in-queue.types';

export type {
  QueueEntry,
  WalkInCheckIn,
  WalkInCheckInRequest,
  WalkInQueueResult,
  WalkInQueueState,
} from './walk-in-queue.types';

/** Конфлікт «нікого посадити»: id — UUID v7, як будь-який доменний id (ADR 0021). */
function noAvailabilityConflict(): ShiftConflict {
  return {
    id: uuidv7(),
    type: 'max_hours_exceeded',
    message: 'No barbers available at this time',
    affectedShifts: [],
  };
}

/**
 * Check in a walk-in client and assign them to a barber station.
 * Uses the existing shift bidding optimization logic to find the best barber match.
 */
export function checkInWalkInClient(request: WalkInCheckInRequest): WalkInQueueResult {
  const { checkIn, barberAvailabilities, openShifts, queue = [] } = request;
  const newQueueEntry: QueueEntry = {
    id: `wi-${Date.now()}`,
    clientId: checkIn.clientId,
    createdAt: new Date(),
    ...(checkIn.preferredService === undefined
      ? {}
      : { preferredService: checkIn.preferredService }),
    partySize: checkIn.partySize ?? 1,
    ...(checkIn.notes === undefined ? {} : { notes: checkIn.notes }),
    status: 'waiting',
  };
  const updatedQueue = [...queue, newQueueEntry];

  const biddingResult = optimizeShiftBidding(openShifts, barberAvailabilities);
  const assignedBarberId = findBestBarberForClient(
    checkIn.preferredService,
    biddingResult,
    barberAvailabilities
  );

  if (!assignedBarberId) {
    return {
      assignedBarberId: '',
      assignedShiftId: '',
      estimatedWaitTimeMinutes: 30,
      alternativeBarbers: availableBarbers(barberAvailabilities).map((ba) => ba.barberId),
      conflict: noAvailabilityConflict(),
    };
  }

  const assignedShift = openShifts.find(
    (shift) => shift.barberId === assignedBarberId && shift.status === 'open'
  );

  return {
    assignedBarberId,
    assignedShiftId: assignedShift?.id || '',
    estimatedWaitTimeMinutes: calculateEstimatedWaitTime(updatedQueue),
    alternativeBarbers: getAlternativeBarbers(assignedBarberId, barberAvailabilities),
  };
}
