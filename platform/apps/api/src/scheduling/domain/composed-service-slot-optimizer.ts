/**
 * FADE Multi-Service Composed Slot Optimizer & Conflict Resolution Engine
 * Optimizes scheduling when booking multi-service appointments across multiple barbers or consecutive time blocks.
 */

export interface ComposedServiceItem {
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  requiredSpecialty?: string;
  preferredBarberId?: string;
}

export interface BarberAvailabilityWindow {
  barberId: string;
  barberName: string;
  specialties: string[];
  availableIntervals: { startMinute: number; endMinute: number }[];
}

export interface ComposedSlotRequest {
  clientId: string;
  services: ComposedServiceItem[];
  barbers: BarberAvailabilityWindow[];
  targetDayStartMinute: number;
  allowParallelBarbers?: boolean; // if true, independent services can run in parallel if multiple barbers available
}

export interface ComposedSlotAllocation {
  serviceId: string;
  barberId: string;
  startMinute: number;
  endMinute: number;
}

export interface ComposedSlotResult {
  success: boolean;
  allocations: ComposedSlotAllocation[];
  totalDurationMinutes: number;
  bufferMinutesBetweenServices: number;
  feasibilityScore: number; // 0 to 1
  reason?: string;
}

export class ComposedServiceSlotOptimizer {
  static optimize(request: ComposedSlotRequest, bufferMinutes = 5): ComposedSlotResult {
    const allocations: ComposedSlotAllocation[] = [];
    let currentCursor = request.targetDayStartMinute;
    let totalDuration = 0;

    const barbersMap = new Map(request.barbers.map(b => [b.barberId, b]));

    for (let i = 0; i < request.services.length; i++) {
      const service = request.services[i];
      if (!service) {
        continue;
      }
      let assignedBarber: BarberAvailabilityWindow | undefined = undefined;
      let matchedInterval: { startMinute: number; endMinute: number } | undefined = undefined;

      // Try preferred barber first if specified
      if (service.preferredBarberId && barbersMap.has(service.preferredBarberId)) {
        const b = barbersMap.get(service.preferredBarberId)!;
        const interval = b.availableIntervals.find(
          inv => inv.startMinute <= currentCursor && inv.endMinute >= currentCursor + service.durationMinutes
        );
        if (interval) {
          assignedBarber = b;
          matchedInterval = interval;
        }
      }

      // If no preferred or preferred not available, find any qualified barber
      if (!assignedBarber) {
        for (const barber of request.barbers) {
          if (service.requiredSpecialty && !barber.specialties.includes(service.requiredSpecialty)) {
            continue;
          }
          const interval = barber.availableIntervals.find(
            inv => inv.startMinute <= currentCursor && inv.endMinute >= currentCursor + service.durationMinutes
          );
          if (interval) {
            assignedBarber = barber;
            matchedInterval = interval;
            break;
          }
        }
      }

      if (!assignedBarber || !matchedInterval) {
        return {
          success: false,
          allocations,
          totalDurationMinutes: totalDuration,
          bufferMinutesBetweenServices: bufferMinutes,
          feasibilityScore: i / request.services.length,
          reason: `Could not schedule service ${service.serviceName} starting at minute ${currentCursor}`
        };
      }

      const startMinute = currentCursor;
      const endMinute = startMinute + service.durationMinutes;

      allocations.push({
        serviceId: service.serviceId,
        barberId: assignedBarber.barberId,
        startMinute,
        endMinute
      });

      totalDuration += service.durationMinutes;
      currentCursor = endMinute + bufferMinutes;
    }

    return {
      success: true,
      allocations,
      totalDurationMinutes: totalDuration,
      bufferMinutesBetweenServices: bufferMinutes,
      feasibilityScore: 1.0
    };
  }
}
