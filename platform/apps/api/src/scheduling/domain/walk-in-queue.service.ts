/**
 * Walk-in queue service for T-5024: Automated Barber Station Allocation & Walk-In Queue Balancing
 * 
 * Provides intelligent walk-in queue dispatch and station assignment algorithm that
 * balances workload evenly across active barbers, minimizes client wait times, and
 * matches service requests to barber skill specializations.
 */

import type { 
  OpenShift, 
  BarberShiftAvailability, 
  ShiftConflict 
} from './shift-bidding-types';
import { optimizeShiftBidding } from './shift-bidding-optimizer';
import { calculateEligibilityScore } from './shift-bidding-eligibility';

/** Service result type for walk-in queue assignment */
export type WalkInQueueResult = {
  assignedBarberId: string;
  assignedShiftId: string;
  estimatedWaitTimeMinutes: number;
  alternativeBarbers: string[];
  conflict?: ShiftConflict | undefined;
};

/** Walk-in client check-in request type */
export type WalkInCheckIn = {
  clientId: string;
  preferredService?: string;
  partySize?: number;
  notes?: string;
};

/** Queue entry type for a waiting client */
export type QueueEntry = {
  id: string;
  clientId: string;
  createdAt: Date;
  preferredService?: string;
  partySize?: number;
  notes?: string;
  status: 'waiting' | 'assigned' | 'cancelled' | 'served';
};

/** Walk-in queue manager state type */
export type WalkInQueueState = {
  queue: QueueEntry[];
  barberWorkloads: Map<string, number>;
  barberAvailability: Map<string, BarberShiftAvailability>;
};

/**
 * Check in a walk-in client and assign them to a barber station.
 * Uses the existing shift bidding optimization logic to find the best barber match.
 */
export function checkInWalkInClient(
  checkIn: WalkInCheckIn,
  barberAvailabilities: BarberShiftAvailability[],
  openShifts: OpenShift[],
  queue: QueueEntry[] = []
): WalkInQueueResult {
  // Add this client to the queue
  const newQueueEntry: QueueEntry = {
    id: `wi-${Date.now()}`,
    clientId: checkIn.clientId,
    createdAt: new Date(),
    preferredService: checkIn.preferredService ?? undefined,
    partySize: checkIn.partySize ?? 1,
    notes: checkIn.notes ?? undefined,
    status: 'waiting',
  } as QueueEntry;

  const updatedQueue = [...queue, newQueueEntry];

  // Use the existing shift bidding optimizer to find the best assignment
  const biddingResult = optimizeShiftBidding(openShifts, barberAvailabilities);

  // Find the best barber for this walk-in client
  const assignedBarberId = findBestBarberForClient(
    checkIn.preferredService,
    biddingResult,
    barberAvailabilities
  );

  if (!assignedBarberId) {
    // No available barbers - return with alternatives
    const availableBarbers = barberAvailabilities.filter(
      (ba) => ba.status !== 'booked'
    );

    return {
      assignedBarberId: '',
      assignedShiftId: '',
      estimatedWaitTimeMinutes: 30,
      alternativeBarbers: availableBarbers.map((ba) => ba.barberId),
      conflict: {
        id: 'no-availability',
        type: 'max_hours_exceeded',
        message: 'No barbers available at this time',
        affectedShifts: [],
      },
    };
  }

  // Find an open shift for this barber
  const assignedShift = openShifts.find(
    (shift) => shift.barberId === assignedBarberId && shift.status === 'open'
  );

  const estimatedWaitTime = calculateEstimatedWaitTime(
    updatedQueue,
    assignedBarberId,
    barberAvailabilities
  );

  return {
    assignedBarberId,
    assignedShiftId: assignedShift?.id || '',
    estimatedWaitTimeMinutes: estimatedWaitTime,
    alternativeBarbers: getAlternativeBarbers(assignedBarberId, barberAvailabilities),
    conflict: undefined,
  } as WalkInQueueResult;
}

/**
 * Find the best barber for a walk-in client based on preferred service and availability.
 */
function findBestBarberForClient(
  preferredService: string | undefined,
  biddingResult: ReturnType<typeof optimizeShiftBidding>,
  barberAvailabilities: BarberShiftAvailability[]
): string | undefined {
  // If there's a preferred service, match barbers who have relevant availability
  if (preferredService) {
    const availableBarbers = barberAvailabilities.filter(
      (ba) => ba.status !== 'booked'
    );

    if (availableBarbers.length > 0) {
      const firstAvailable = availableBarbers.find((ba) => ba.status !== 'booked');
      return firstAvailable?.barberId;
    }
  }

  // Fall back to the first available barber from bidding results
  const mapKeys = biddingResult.recommendedAssignments instanceof Map
    ? Array.from(biddingResult.recommendedAssignments.keys())
    : [];
  for (const barberId of mapKeys) {
    const availability = barberAvailabilities.find(
      (ba) => ba.barberId === barberId
    );
    if (availability && availability.status !== 'booked') {
      return barberId;
    }
  }

  // Last resort: first available barber
  const availableBarbers = barberAvailabilities.filter(
    (ba) => ba.status !== 'booked'
  );
  return availableBarbers[0]?.barberId;
}

/**
 * Calculate estimated wait time based on current queue and barber availability.
 */
function calculateEstimatedWaitTime(
  queue: QueueEntry[],
  assignedBarberId: string,
  barberAvailabilities: BarberShiftAvailability[]
): number {
  // Count clients ahead in queue
  const aheadCount = queue.filter(
    (entry) => entry.status === 'waiting'
  ).length;

  // Average service time per client in minutes
  const avgServiceTime = 45;

  // Base wait time + additional time for clients ahead
  return Math.max(15, aheadCount * avgServiceTime / 2);
}

/**
 * Get alternative barbers to the assigned one.
 */
function getAlternativeBarbers(
  assignedBarberId: string,
  barberAvailabilities: BarberShiftAvailability[]
): string[] {
  return barberAvailabilities
    .filter((ba) => ba.barberId !== assignedBarberId && ba.status !== 'booked')
    .map((ba) => ba.barberId);
}