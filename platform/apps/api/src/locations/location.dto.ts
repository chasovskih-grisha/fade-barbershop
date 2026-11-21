/* eslint-disable max-lines -- cohesive module (108 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Location DTOs — T-105: Second Location, MNG-ADM-11.
// Consolidated output types; removed LocationBasicOutput overlap.
// Idempotency key removed from update input (per ADR 0021 clean-principle).

import { IdempotencyKey } from '../shared/decorators/idempotency-key.decorator';

// Location creation input
export class CreateLocationInput {
  @IdempotencyKey()
  code: string;
  name: string;
  address: string;
  street?: string;
  building?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  lat: number;
  lng: number;
  phone?: string;
  email?: string;
  channels?: { channel: string; value: string; sortOrder: number }[];
  photos?: { url: string; caption: string; sortOrder: number }[];
}

// Location update input — no @IdempotencyKey (update operations are inherently idempotent by HTTP verb; key reserved for create race-condition prevention).
export class UpdateLocationInput {
  name?: string;
  address?: string;
  street?: string;
  building?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  active?: boolean;
}

// Franchise mode toggle input
export class ToggleFranchiseModeInput {
  enabled: boolean;
  adminId: string;
}

// Consolidated location output DTO — single source of truth for location representation.
// Used by both list and detail endpoints; undefined fields omitted at serialization.
export class LocationOutput {
  id: string;
  code: string;
  name: string;
  address: string;
  street?: string;
  building?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  channels?: { channel: string; value: string; sortOrder: number }[];
  photos?: { url: string; caption: string; sortOrder: number }[];
  servicePrices?: { serviceId: string; amount: number; active: boolean }[];
  staffAssignments?: number;
  active?: boolean;
  chairsCount?: number;
  lat?: number;
  lng?: number;
  createdAt: Date;
}

// Location pricing output
export class LocationPricingOutput {
  success: boolean;
  data: { serviceId: string; serviceName: string; amount: number; active: boolean }[];
}

// Manager assignment output
export class ManagerAssignmentOutput {
  success: boolean;
  data: {
    barberId: string;
    locationId: string;
    assignedAt: string;
  } | null;
}

// Booking list output
export class BookingOutput {
  id: string;
  clientId?: string;
  barberId?: string;
  serviceId?: string;
  status: string;
  start: string;
  end: string;
  source: string;
  agreedPrice?: number;
  finalPrice?: number;
}

export class BookingListOutput {
  success: boolean;
  data: BookingOutput[];
}

// No-show rates output
export class NoShowRatesOutput {
  success: boolean;
  data: Record<string, { total: number; noShows: number; rate: number }>;
}

// Staff assignment output
export class StaffAssignmentOutput {
  barberId: string;
  barberName?: string;
  barberPhone?: string;
  locationId: string;
  assignedAt: string;
}

/** Location list response wrapper. */
export class LocationListOutput {
  success!: boolean;
  data!: LocationOutput[];
}

/** Location detail response wrapper (get/create/update). */
export class LocationDetailOutput {
  success!: boolean;
  data!: LocationOutput;
}

/** Staff assignments list response wrapper. */
export class StaffAssignmentListOutput {
  success!: boolean;
  data!: StaffAssignmentOutput[];
}
