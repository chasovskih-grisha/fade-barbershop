// BookingReader — короткі read‑запити флоу запису (BookingController):
// активні локації, послуги локації та активні барбери з опцією «Будь-який барбер».
// Розрахунок вільних слотів — у AvailableSlots.

import { Injectable } from '@nestjs/common';
import { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import { PrismaStaffAssignmentRepository } from '../../locations/infrastructure/prisma-staff-assignment.repository';
import { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';
import { PrismaUserRepository } from '../../identity/infrastructure/prisma-adapters';
import { PrismaBarberPhotoRepository } from '../../identity/infrastructure/prisma-barber-photo.repository';
import type { User } from '../../identity/domain/user';
import type { PublicMediaStorage } from '../../shared/media/public-media-storage';
import type { BarberServiceAssignmentRepository } from '../../scheduling/domain/ports.barber-service-assignment';
import { barbersForService } from '../../scheduling/domain/barber-service-matrix';
import { toLocationDto } from '../../locations/infrastructure/admin-locations.controller';
import { LocationDto } from '../dto/location.dto';
import { ServiceDto } from '../dto/service.dto';
import { BarberDto } from '../dto/barber.dto';
import { WaitlistEntryDto } from '../dto/waitlist-entry.dto';

export interface BookingReaderDeps {
  locationRepo: PrismaLocationRepository;
  userRepo: PrismaUserRepository;
  serviceRepo: PrismaServiceRepository;
  staffAssignments: PrismaStaffAssignmentRepository;
  /** Матриця «барбер × послуга» (T-4521); без неї фільтр кроку 2 не діє. */
  assignments?: BarberServiceAssignmentRepository;
  photos?: PrismaBarberPhotoRepository;
  media?: PublicMediaStorage;
}

@Injectable()
export class BookingReader {
  constructor(private readonly deps: BookingReaderDeps) {}

  async listLocations(): Promise<LocationDto[]> {
    return (await this.deps.locationRepo.listActive()).map((location) => toLocationDto(location));
  }

  async listServices(locationId: string): Promise<ServiceDto[]> {
    return this.deps.serviceRepo.catalogForLocation(locationId);
  }

  // MNG-ADM-05/06 (екран 2): лише активні барбери саме цієї локації (StaffAssignment);
  // «Будь-який барбер» — перша опція (web-screens §1.3). За наявності `serviceId`
  // (T-4521) лишаються тільки барбери, що виконують цю послугу за матрицею.
  async listBarbers(locationId: string, serviceId?: string): Promise<BarberDto[]> {
    const assigned = new Set(
      (await this.deps.staffAssignments.listByLocation(locationId)).map((a) => a.barberId)
    );
    const barbers = (await this.deps.userRepo.listByRole('barber')).filter(
      (barber) => barber.active && assigned.has(barber.id)
    );
    const filtered = await this.filterByService(locationId, serviceId, barbers);
    const location = await this.deps.locationRepo.findById(locationId);
    const locationName = location ? location.name : undefined;

    const anyBarber: BarberDto = { id: '', name: 'Будь-який барбер', any: true };
    const result: BarberDto[] = [anyBarber];

    for (const b of filtered) {
      let photoDto = null;
      if (this.deps.photos && this.deps.media) {
        const photo = await this.deps.photos.findByUserId(b.id);
        if (photo && photo.consentAt) {
          photoDto = {
            url: this.deps.media.publicUrl(photo.objectKey),
            alt: photo.alt,
            width: photo.width,
            height: photo.height,
          };
        }
      }
      result.push({
        id: b.id,
        name: b.name ?? b.phone.value,
        photo: photoDto,
        locationName: locationName ?? undefined,
      });
    }
    return result;
  }

  // T-4521 крок 2: без `serviceId` або без матриці список не звужується.
  private async filterByService(
    locationId: string,
    serviceId: string | undefined,
    barbers: User[]
  ): Promise<User[]> {
    const repo = this.deps.assignments;
    if (!serviceId || !repo) return barbers;
    const snapshot = await repo.snapshotForLocation(locationId);
    const allowed = barbersForService(
      snapshot.matrix,
      { locationId, serviceId },
      barbers.map((b) => b.id)
    );
    return barbers.filter((b) => allowed.has(b.id));
  }

  // T-053h waitlist integration
  async joinWaitlist(
    locationId: string,
    serviceId: string,
    barberId?: string
  ): Promise<{ entryId: string; queuePosition: number }> {
    // Create waitlist entry for the client
    const client = await this.deps.userRepo.findActiveClient();
    if (!client) throw new Error('No active client for waitlist');
    const entryId = `wl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const entry: WaitlistEntryDto = {
      id: entryId,
      clientId: client.id,
      locationId,
      serviceId,
      barberId,
      status: 'WAITING',
      waitingSince: new Date(),
      vipLevel: 0,
      noShowCount90d: 0,
    };
    // Persist the entry
    await this.deps.userRepo.addWaitlistEntry(entry);
    // Compute queue position
    const position = await this.computeWaitlistPosition(entryId, locationId, serviceId, barberId);
    return { entryId, queuePosition: position };
  }

  async getWaitlistPosition(
    entryId: string
  ): Promise<{ queuePosition: number; estimatedWaitMinutes: number }> {
    const queuePosition = await this.computeWaitlistPosition(
      entryId,
      undefined,
      undefined,
      undefined
    );
    return { queuePosition, estimatedWaitMinutes: queuePosition * 15 };
  }

  async cancelWaitlist(entryId: string): Promise<{ cancelled: boolean }> {
    await this.deps.userRepo.removeWaitlistEntry(entryId);
    return { cancelled: true };
  }

  private async computeWaitlistPosition(
    entryId: string,
    locationId?: string,
    serviceId?: string,
    barberId?: string
  ): Promise<number> {
    // Filter waiting entries matching criteria
    const filters: any = { status: 'WAITING' };
    if (locationId) filters.locationId = locationId;
    if (serviceId) filters.serviceId = serviceId;
    if (barberId) filters.barberId = barberId;

    const entries = await this.deps.userRepo.listWaitingEntries(filters);
    // Find this entry's position (1-indexed, sorted by priority then FIFO)
    const target = entries.find((e) => e.id === entryId);
    if (!target) return 1;

    // Sort: higher priority first, then earlier waitingSince (FIFO)
    const sorted = entries.sort((a, b) => {
      const priorityA = (a.vipLevel ?? 0) * 100 + (a.waitingSince?.getTime() ?? 0);
      const priorityB = (b.vipLevel ?? 0) * 100 + (b.waitingSince?.getTime() ?? 0);
      if (priorityB !== priorityA) return priorityB - priorityA;
      return (a.waitingSince?.getTime() ?? 0) - (b.waitingSince?.getTime() ?? 0);
    });

    return sorted.findIndex((e) => e.id === entryId) + 1;
  }
}
