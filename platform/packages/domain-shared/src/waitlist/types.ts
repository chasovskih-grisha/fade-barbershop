export enum WaitlistStatus {
  PENDING = 'PENDING',
  OFFERED = 'OFFERED',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
}

export interface WaitlistEntry {
  id: string;
  clientId: string;
  locationId: string;
  serviceId: string;
  barberId?: string;
  preferredDate: string; // ISO date string YYYY-MM-DD
  priorityScore: number; // Higher number = higher priority (e.g. VIP / loyalty)
  status: WaitlistStatus;
  createdAt: string; // ISO timestamp
  softHoldExpiresAt?: string; // ISO timestamp when offered
}

export interface SoftHoldConfig {
  holdDurationMinutes: number; // e.g. 30 minutes
}

export interface SlotRecoveryEvent {
  slotTime: string; // ISO timestamp
  locationId: string;
  serviceId: string;
  barberId?: string;
}
