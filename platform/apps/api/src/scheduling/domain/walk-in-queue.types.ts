/** Типи черги walk-in і запиту на посадку (T-5024). */
import type {
  BarberShiftAvailability,
  OpenShift,
  ShiftConflict,
} from './shift-bidding-types';

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

/** One check-in: заявка клієнта, вільні зміни барберів і поточна черга. */
export interface WalkInCheckInRequest {
  readonly checkIn: WalkInCheckIn;
  readonly barberAvailabilities: BarberShiftAvailability[];
  readonly openShifts: OpenShift[];
  readonly queue?: QueueEntry[];
}
