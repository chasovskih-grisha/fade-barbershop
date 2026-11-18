import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  BarberServiceAssignmentRepository,
  type BarberServiceAssignmentSnapshot,
} from '../domain/ports.barber-service-assignment';

@Injectable()
export class PrismaBarberServiceAssignmentRepository implements BarberServiceAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async snapshotForLocation(locationId: string): Promise<BarberServiceAssignmentSnapshot> {
    const rows = await this.prisma.barberServiceAssignment.findMany({
      where: { locationId, active: true },
      select: { barberId: true, serviceId: true },
    });

    const matrix = new Map<string, Map<string, Set<string>>>();
    for (const row of rows) {
      let byLocation = matrix.get(row.barberId);
      if (!byLocation) {
        byLocation = new Map<string, Set<string>>();
        matrix.set(row.barberId, byLocation);
      }
      let services = byLocation.get(locationId);
      if (!services) {
        services = new Set<string>();
        byLocation.set(locationId, services);
      }
      services.add(row.serviceId);
    }

    return { matrix };
  }

  async setAssignment(input: {
    barberId: string;
    locationId: string;
    serviceId: string;
    active: boolean;
  }): Promise<void> {
    await this.prisma.barberServiceAssignment.upsert({
      where: {
        barberId_locationId_serviceId: {
          barberId: input.barberId,
          locationId: input.locationId,
          serviceId: input.serviceId,
        },
      },
      create: {
        id: input.barberId + '::' + input.locationId + '::' + input.serviceId,
        barberId: input.barberId,
        locationId: input.locationId,
        serviceId: input.serviceId,
        active: input.active,
      },
      update: { active: input.active },
    });
  }

  async removeAssignmentsForBarber(barberId: string, locationId: string): Promise<void> {
    await this.prisma.barberServiceAssignment.deleteMany({
      where: { barberId, locationId },
    });
  }
}
