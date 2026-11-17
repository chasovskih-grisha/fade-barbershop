import { prisma } from '../../..';
import { Location, ServicePrice, StaffAssignment, BarberServiceAssignment, Booking, OnlineBookingPolicy } from '../../domain';
import { AppSetting } from '../identity/domain';

/** T-105: Second Location - location management and multi-shop support.
 * Extends the existing Location model with franchise/chain mode,
 * manager roles, and per-location configuration.
 */
export class LocationService {

  /** Get all active locations */
  async getAllLocations(): Promise<Location[]> {
    return prisma.location.findMany({
      where: { active: true },
      include: {
        servicePrices: true,
        chairs: true,
        staffAssignments: true,
      },
      order: { code: 'asc' },
    });
  }

  /** Get single location by code */
  async getLocationByCode(code: string): Promise<Location | null> {
    return prisma.location.findUnique({
      where: { code, active: true },
      include: {
        servicePrices: true,
        chairs: true,
        staffAssignments: true,
      },
    });
  }

  /** Create new location */
  async createLocation(data: {
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
  }): Promise<Location> {
    return prisma.location.create({
      data: {
        code: data.code,
        name: data.name,
        address: data.address,
        street: data.street,
        building: data.building,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        email: data.email,
        active: true,
        channels: data.channels ? {
          createMany: {
            data: data.channels.map(c => ({
              channel: c.channel,
              value: c.value,
              sortOrder: c.sortOrder,
            })),
          },
        } : undefined,
        photos: data.photos ? {
          createMany: {
            data: data.photos.map(p => ({
              url: p.url,
              caption: p.caption,
              sortOrder: p.sortOrder,
            })),
          },
        } : undefined,
        servicePrices: [],
        chairs: [],
        staffAssignments: [],
      },
      include: {
        servicePrices: true,
        chairs: true,
        staffAssignments: true,
      },
    });
  }

  /** Update location */
  async updateLocation(
    id: string,
    data: Partial<{
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
      active?: boolean;
    }>,
  ): Promise<Location> {
    return prisma.location.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        street: data.street,
        building: data.building,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        email: data.email,
        active: data.active,
      },
      include: {
        servicePrices: true,
        chairs: true,
      },
    });
  }

  /** Toggle franchise/chain mode */
  async toggleFranchiseMode(enabled: boolean, adminId: string): Promise<AppSetting> {
    const key = 'franchise.mode';
    return prisma.appSetting.upsert({
      where: { key },
      update: {
        value: { enabled, adminId, timestamp: new Date().toISOString() },
        updatedAt: new Date(),
      },
      create: {
        key,
        value: { enabled, adminId, timestamp: new Date().toISOString() },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /** Get franchise mode setting */
  async getFranchiseMode(): Promise<{ enabled: boolean; adminId?: string; timestamp: string } | null> {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'franchise.mode' },
    });
    if (!setting || !setting.value || typeof setting.value !== 'object') return null;
    return {
      enabled: setting.value.enabled,
      adminId: setting.value.adminId,
      timestamp: setting.value.timestamp,
    };
  }

  /** Per-location pricing configuration */
  async getLocationPricing(locationId: string): Promise<ServicePrice[]> {
    return prisma.servicePrice.findMany({
      where: { locationId, active: true },
      include: { service: true },
    });
  }

  async updateLocationPricing(
    locationId: string,
    prices: { serviceId: string; amount: number }[],
  ): Promise<ServicePrice[]> {
    // Delete existing prices for this location
    await prisma.servicePrice.deleteMany({ where: { locationId } });
    
    // Create new prices
    const created: ServicePrice[] = [];
    for (const { serviceId, amount } of prices) {
      const price = await prisma.servicePrice.create({
        data: {
          serviceId,
          locationId,
          amount,
          active: true,
        },
        include: { service: true },
      });
      created.push(price);
    }
    return created;
  }

  /** Manager role assignment per location */
  async assignManagerToLocation(
    locationId: string,
    userId: string,
    managerId: string,
  ): Promise<StaffAssignment> {
    return prisma.staffAssignment.upsert({
      where: { barberId_locationId: { barberId: userId, locationId } },
      update: {},
      create: {
        barberId: userId,
        locationId,
      },
    });
  }

  async getLocationManager(locationId: string): Promise<StaffAssignment | null> {
    return prisma.staffAssignment.findFirst({
      where: { locationId },
    });
  }

  /** Get bookings filtered by location */
  async getBookingsByLocation(
    locationId: string,
    status?: string,
  ): Promise<Booking[]> {
    const where: any = { locationId };
    if (status) {
      where.status = status;
    }
    return prisma.booking.findMany({
      where,
      include: {
        service: true,
        barber: true,
        client: true,
      },
      order: { start: 'desc' },
    });
  }

  /** Get no-show rates filtered by location (NSH-005) */
  async getNoShowRatesByLocation(
    locationId: string,
    appointments: any[],
  ): Record<string, { total: number; noShows: number; rate: number }> {
    const stats: any = {
      online_with_deposit: { total: 0, noShows: 0 },
      online_without_deposit: { total: 0, noShows: 0 },
      walk_in: { total: 0, noShows: 0 },
    };

    for (const appt of appointments) {
      if (stats[appt.channel]) {
        stats[appt.channel].total += 1;
        if (appt.status === 'no_show') {
          stats[appt.channel].noShows += 1;
        }
      }
    }

    const result: Record<string, { total: number; noShows: number; rate: number }> = {};
    for (const channel of Object.keys(stats) as string[]) {
      const s = stats[channel];
      const rate = s.total > 0 ? s.noShows / s.total : 0;
      result[channel] = {
        total: s.total,
        noShows: s.noShows,
        rate: Number(rate.toFixed(4)),
      };
    }
    return result;
  }

  /** Get staff assignments for location */
  async getStaffAssignments(locationId: string): Promise<any[]> {
    return prisma.staffAssignment.findMany({
      where: { locationId },
      include: { barber: { include: { user: true } } },
    });
  }
}