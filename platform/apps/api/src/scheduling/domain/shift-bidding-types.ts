// Shift bidding and marketplace types for T-5012: Dynamic Staff Scheduling & Shift Bidding Marketplace

export type { ShiftChangeRequest, ShiftChangeSlot } from './shift-change-request.types';

/** Available shift that barbers can bid on or that managers can publish */
export interface OpenShift {
  id: string;
  barberId?: string | null; // null = open for any barber
  locationId: string;
  start: Date;
  end: Date;
  serviceIds?: string[]; // Optional: services this shift covers
  requiredSkillLevel?: 'junior' | 'middle' | 'senior' | null;
  minRestMinutesBetweenShifts?: number; // Minimum rest period after this shift
  createdBy?: string; // Manager or system
  createdAt: Date;
  status: 'open' | 'booked' | 'cancelled' | 'expired';
}

/** Barber's bid on an open shift */
export interface ShiftBid {
  id: string;
  shiftId: string;
  barberId: string;
  bidAmount?: number; // Optional premium amount barber accepts
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  bidAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
}

/** Manager's shift template with demand overlay */
export interface ShiftTemplate {
  id: string;
  name: string;
  locationId: string;
  description?: string;
  pattern: ShiftPattern;
  demandOverlay?: DemandOverlay;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

/** Shift pattern (e.g., standard 9-5, weekend, custom) */
export type ShiftPattern = 'standard-day' | 'standard-half-day' | 'weekend' | 'custom' | 'on-call';

/** Demand overlay for shift templates */
export interface DemandOverlay {
  peakHours: number[]; // Hours with highest demand (e.g., [10, 14, 16])
  minBarbersRequired: number;
  maxBarbersAllowed: number;
  preferredSkillLevel?: 'junior' | 'middle' | 'senior';
}

/** Barber's availability for shift bidding */
export interface BarberShiftAvailability {
  barberId: string;
  locationId: string;
  // Minimum and maximum hours barber is willing to work
  minWeeklyHours: number;
  maxWeeklyHours: number;
  // Preferred shift times (hour ranges)
  preferredShiftRanges: number[][]; // e.g., [[9, 12], [14, 18]]
  // Forbidden shift times
  forbiddenShiftRanges: number[][]; // e.g., [[1, 3]] for early morning
  // Minimum rest between shifts in minutes
  minRestMinutes: number;
  // Maximum consecutive working days
  maxConsecutiveDays: number;
}

/** Conflict check result for shift scheduling */
export interface ShiftConflict {
  id: string;
  type: 'overlap' | 'min_rest_violation' | 'max_hours_exceeded' | 'skill_mismatch';
  message: string;
  affectedShifts: string[]; // Shift IDs involved
}

/** Result of shift bidding optimization */
export interface ShiftBiddingResult {
  openShifts: OpenShift[];
  barberBids: Map<string, ShiftBid[]>; // barberId -> bids
  conflicts: ShiftConflict[];
  recommendedAssignments: Map<string, string[]>; // barberId -> assigned shift IDs
  unresolvedShifts: OpenShift[]; // Shifts with no bids or conflicts
}
