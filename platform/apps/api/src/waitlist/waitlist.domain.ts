import { prisma } from '../index';
import { Location, Service, Booking, AppointmentParty } from '../domain';
import { randomUUID } from 'node:crypto';

/** Waitlist Entry Configuration (ADR 0012) */
export enum WaitlistEntryStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  EXPIRED = 'expired',
  FULFILLED = 'fulfilled',
  PAUSED = 'paused', // anti-spam: 3 misses → pause
}

/** Slot Hold Configuration (ADR 0012) */
export enum HoldStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  MANUALLY_RELEASED = 'manually_released',
}

/** Waitlist Entry - configuration + state */
export interface WaitlistEntry {
  id: string;
  slotId: string; // the slot that was held
  clientId: string;
  locationId: string;
  barberId: string;
  serviceId: string;
  agreedPrice: number; // price at time of hold (snapshot)
  holdExpiry: Date; // 15 min from hold creation
  status: WaitlistEntryStatus;
  holdStatus: HoldStatus;
  missedCount: number; // anti-spam counter
  createdAt: Date;
  releasedAt?: Date;
  cascadeToNext: boolean; // whether to auto-offer to next person
}

/** Slot Hold - 15 minute hold on a slot (not a booking) */
export interface SlotHold {
  id: string;
  slotId: string;
  locationId: string;
  barberId: string;
  holdExpiry: Date;
  holdByClientId?: string; // client who holds the slot
  holdByTime: Date; // when hold was created
  status: HoldStatus;
  releasedAt?: Date;
}

/** Waitlist Configuration (per location or global) */
export interface WaitlistConfig {
  maxMissedBeforePause: number; // 3 misses → pause
  holdDurationMinutes: number; // 15 min default
  autoCascade: boolean; // auto-offer to next person
  requestRateLimitPerHour: number; // prevent spam
  allowWithoutPush: boolean; // WTL-008: false by default
}

/** Release Source for waitlist */
export enum ReleaseSource {
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_NO_SHOW = 'appointment_no_show',
  ADMIN_RELEASED = 'admin_released',
}

/** Client Waitlist History */
export interface ClientWaitlistHistory {
  clientId: string;
  noShowsOnWaitlist: number;
  missesOnWaitlist: number;
  lastMissedAt?: Date;
  isPaused: boolean;
  pauseUntil?: Date;
}

/** Waitlist Offer - sent to client */
export interface WaitlistOffer {
  offerId: string;
  slotId: string;
  locationId: string;
  barberId: string;
  serviceId: string;
  agreedPrice: number;
  holdExpiry: Date;
  offerExpiry: Date; // how long offer is valid
  source: ReleaseSource;
  message: string;
}

/** Waitlist Service Deps */
export interface WaitlistServiceDeps {
  createWaitlistEntry: (entry: Omit<WaitlistEntry, 'id'>) => Promise<WaitlistEntry>;
  holdSlot: (slotId: string, clientId: string, locationId: string) => Promise<SlotHold>;
  releaseHold: (holdId: string, source: ReleaseSource, releasedBy: string) => Promise<void>;
  getActiveWaitlist: (locationId?: string) => Promise<WaitlistEntry[]>;
  getClientHistory: (clientId: string) => Promise<ClientWaitlistHistory>;
  checkRateLimit: (clientId: string, hour: number) => Promise<boolean>;
  fulfillWaitlistEntry: (offerId: string, clientId: string) => Promise<Booking>;
}

/** Default waitlist configuration */
export const DEFAULT_WAITLIST_CONFIG: WaitlistConfig = {
  maxMissedBeforePause: 3,
  holdDurationMinutes: 15,
  autoCascade: true,
  requestRateLimitPerHour: 5,
  allowWithoutPush: false,
};