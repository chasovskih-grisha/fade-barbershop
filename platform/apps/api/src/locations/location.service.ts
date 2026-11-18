// Location Service (T-105: Second Location — simplified).
// Extends the Location model with franchise/chain mode, manager roles,
// and per-location configuration. Cleaned up: consolidated DTO references,
// removed redundant include selections, streamlined update logic.

import { prisma } from '../index';
import { Location, ServicePrice, StaffAssignment, BarberServiceAssignment, Booking, OnlineBookingPolicy } from '../../domain';
import { AppSetting } from '../identity/domain';

/** T-105: Second Location - location management and multi-shop support.
 * Consolidated output via LocationOutput DTO; no duplicate BasicOutput type.
 * Update operations have no @IdempotencyKey (HTTP PUT is idempotent by design).
 */
export class LocationService {

  /** Get all active locations --- returns minimal LocationOutput subset. */
  async getAllLocations(): Promise<{ id: string; code: string; name: string; address: string; phone?: string; email?: string; active: boolean; chairsCount: number; createdAt: Date }[]> {
    const rows = await prisma.location.findMany({
      where: { active: true },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        active: true,
        chairs: { select: { id: true } },
        createdAt: true,
      },
      order: { code: 'asc' },
    });
    return rows.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      address: r.address,
      phone: r.phone,
      email: r.email,
      active: r.active,
      chairsCount: r.chairs?.length ?? 0,
      createdAt: r.createdAt,
    }));
  }

  /** Get single location by code --- full LocationOutput. */
  async getLocationByCode(code: string): Promise<LocationOutput | null> {
    const row = await prisma.location.findUnique({
      where: { code, active: true },
      include: {
        servicePrices: { include: { service: true } },
        chairs: true,
        staffAssignments: { include: { user: true } },
        photos: true,
        channels: true,
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      address: row.address,
      street: row.street,
      building: row.building,
      city: row.city,
      postalCode: row.postalCode,
      lat: row.lat,
      lng: row.lng,
      phone: row.phone,
      email: row.email,
      channels: row.channels?.map(c => ({
        channel: c.channel,
        value: c.value,
        sortOrder: c.sortOrder,
      })) ?? [],
      photos: row.photos?.map(p => ({
        url: p.url,
        caption: p.caption,
        sortOrder: p.sortOrder,
      })) ?? [],
      servicePrices: row.servicePrices?.map(sp => ({
        serviceId: sp.serviceId,
        amount: sp.amount,
        active: sp.active,
      })) ?? [],
      staffAssignments: row.staffAssignments?.length ?? 0,
      createdAt: row.createdAt,
    } as LocationOutput;
  }

  /** Create new location. */
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
  }): Promise<LocationOutput> {
    const created = await prisma.location.create({
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
        photos: true,
        channels: true,
      },
    });
    return {
      id: created.id,
      code: created.code,
      name: created.name,
      address: created.address,
      street: created.street,
      building: created.building,
      city: created.city,
      postalCode: created.postalCode,
      lat: created.lat,
      lng: created.lng,
      phone: created.phone,
      email: created.email,
      channels: created.channels?.map(c => ({
        channel: c.channel,
        value: c.value,
        sortOrder: c.sortOrder,
      })) ?? [],
      photos: created.photos?.map(p => ({
        url: p.url,
        caption: p.caption,
        sortOrder: p.sortOrder,
      })) ?? [],
      servicePrices: created.servicePrices?.map(sp => ({
        serviceId: sp.serviceId,
        amount: sp.amount,
        active: sp.active,
      })) ?? [],
      staffAssignments: created.staffAssignments?.length ?? 0,
      createdAt: created.createdAt,
    } as LocationOutput;
  }

  /** Update location --- only provided fields are merged; no @IdempotencyKey. */
  async updateLocation(id: string, data: Partial<{
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
  }>): Promise<LocationOutput> {
    const updated = await prisma.location.update({
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
    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      address: updated.address,
      street: updated.street,
      building: updated.building,
      city: updated.city,
      postalCode: updated.postalCode,
      lat: updated.lat,
      lng: updated.lng,
      phone: updated.phone,
      email: updated.email,
      channels: updated.channels?.map(c => ({
        channel: c.channel,
        value: c.value,
        sortOrder: c.sortOrder,
      })) ?? [],
      photos: updated.photos?.map(p => ({
        url: p.url,
        caption: p.caption,
        sortOrder: p.sortOrder,
      })) ?? [],
      servicePrices: updated.servicePrices?.map(sp => ({
        serviceId: sp.serviceId,
        amount: sp.amount,
        active: sp.active,
      })) ?? [],
      staffAssignments: updated.staffAssignments?.length ?? 0,
      createdAt: updated.createdAt,
    } as LocationOutput;
  }

  /** Toggle franchise/chain mode. */
  async toggleFranchiseMode(enabled: boolean, adminId: string): Promise<{ enabled: boolean; adminId: string; timestamp: string }> {
    const key = 'franchise.mode';
    const [setting] = await prisma.appSetting.findOrCreate({
      where: { key },
      defaults: { key, value: { enabled, adminId, timestamp: new Date().toISOString() } },
    });
    setting.value = { enabled, adminId, timestamp: new Date().toISOString() };
    await setting.update({ data: { value: { enabled, adminId, timestamp: new Date().toISOString() }, updatedAt: new Date() } });
    return { enabled, adminId: setting.value.adminId, timestamp: setting.value.timestamp };
  }

  /** Get franchise mode setting. */
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

  /** Per-location pricing configuration. */
  async getLocationPricing(locationId: string): Promise<{ serviceId: string; serviceName: string; amount: number; active: boolean }[]> {
    const rows = await prisma.servicePrice.findMany({
      where: { locationId, active: true },
      include: { service: true },
    });
    return rows.map(sp => ({
      serviceId: sp.serviceId,
      serviceName: sp.service?.name ?? '',
      amount: sp.amount,
      active: sp.active,
    }));
  }

  async updateLocationPricing(locationId: string, prices: { serviceId: string; amount: number }[]): Promise<{ serviceId: string; serviceName: string; amount: number; active: boolean }[]> {
    await prisma.servicePrice.deleteMany({ where: { locationId } });
    const created: any[] = [];
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
      created.push({
        serviceId: price.serviceId,
        serviceName: price.service?.name ?? '',
        amount: price.amount,
        active: price.active,
      });
    }
    return created;
  }

  /** Manager role assignment per location. */
  async assignManagerToLocation(locationId: string, userId: string, managerId: string): Promise<{ barberId: string; locationId: string; assignedAt: string }> {
    const assigned = await prisma.staffAssignment.upsert({
      where: { barberId_locationId: { barberId: userId, locationId } },
      update: {},
      create: {
        barberId: userId,
        locationId,
      },
    });
    return {
      barberId: assigned.barberId,
      locationId: assigned.locationId,
      assignedAt: new Date().toISOString(),
    };
  }

  async getLocationManager(locationId: string): Promise<{ barberId: string; locationId: string; assignedAt: string } | null> {
    const assigned = await prisma.staffAssignment.findFirst({
      where: { locationId },
    });
    if (!assigned) return null;
    return {
      barberId: assigned.barberId,
      locationId: assigned.locationId,
      assignedAt: new Date().toISOString(),
    };
  }

  /** Get bookings filtered by location. */
  async getBookingsByLocation(locationId: string, status?: string): Promise<{ id: string; clientId?: string; barberId?: string; serviceId?: string; status: string; start: string; end: string; source: string; agreedPrice?: number; finalPrice?: number }[]> {
    const where: any = { locationId };
    if (status) {
      where.status = status;
    }
    const rows = await prisma.booking.findMany({
      where,
      include: {
        service: true,
        barber: true,
        client: true,
      },
      order: { start: 'desc' },
    });
    return rows.map(b => ({
      id: b.id,
      clientId: b.clientId,
      barberId: b.barberId,
      serviceId: b.serviceId,
      status: b.status,
      start: b.start?.toISOString(),
      end: b.end?.toISOString(),
      source: b.source,
      agreedPrice: b.agreedPrice,
      finalPrice: b.finalPrice,
    }));
  }

  /** Get no-show rates filtered by location. */
  async getNoShowRatesByLocation(locationId: string, appointments: any[]): Promise<{ [key: string]: { total: number; noShows: number; rate: number } }> {
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

  /** Get staff assignments for location. */
  async getStaffAssignments(locationId: string): Promise<{ barberId: string; barberName?: string; barberPhone?: string; locationId: string; assignedAt: string }[]> {
    const rows = await prisma.staffAssignment.findMany({
      where: { locationId },
      include: { barber: { include: { user: true } } },
    });
    return rows.map(a => ({
      barberId: a.barberId,
      barberName: a.barber?.user?.name,
      barberPhone: a.barber?.user?.phone,
      locationId: a.locationId,
      assignedAt: new Date().toISOString(),
    }));
  }
}
