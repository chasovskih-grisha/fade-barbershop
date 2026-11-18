import { Type } from '@nestjs/common';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';

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

// Location update input
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

// Location output DTOs
export class LocationOutput {
  id: string;
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
  channels: { channel: string; value: string; sortOrder: number }[];
  photos: { url: string; caption: string; sortOrder: number }[];
  servicePrices: { serviceId: string; amount: number; active: boolean }[];
  staffAssignments: number;
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
  };
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