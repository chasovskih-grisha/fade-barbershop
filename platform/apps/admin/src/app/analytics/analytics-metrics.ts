import type { AnalyticsMetrics } from './analytics-types';
import type { CalendarVisitDto } from '../types';
import type { AnalyticsFiltersState } from './analytics-types';

export interface MetricsSource {
  visits: CalendarVisitDto[];
  filters: AnalyticsFiltersState;
  barbers: Array<{ id: string; name: string | null }>;
  locations: Array<{ id: string; name: string }>;
}

function isBooked(visit: CalendarVisitDto): boolean {
  return visit.status === 'completed' || visit.status === 'confirmed';
}

export function computeMetrics({
  visits,
  filters,
  barbers,
  locations,
}: MetricsSource): AnalyticsMetrics {
  let filtered = visits;
  if (filters.locationId !== 'all') {
    filtered = filtered.filter((visit) => visit.locationId === filters.locationId);
  }
  if (filters.barberId !== 'all') {
    filtered = filtered.filter((visit) => visit.barberId === filters.barberId);
  }

  const total = filtered.length;
  const booked = filtered.filter(isBooked);
  const barberMap = new Map<string, { visitsCount: number; revenue: number }>();
  for (const visit of booked) {
    const stats = barberMap.get(visit.barberId) ?? { visitsCount: 0, revenue: 0 };
    stats.visitsCount += 1;
    stats.revenue += visit.agreedPrice ?? 0;
    barberMap.set(visit.barberId, stats);
  }

  const barberPerformance = barbers
    .map((barber) => {
      const stats = barberMap.get(barber.id) ?? { visitsCount: 0, revenue: 0 };
      return {
        barberId: barber.id,
        barberName: barber.name ?? `Майстер #${barber.id.slice(0, 4)}`,
        visitsCount: stats.visitsCount,
        revenue: stats.revenue,
      };
    })
    .filter((entry) => entry.visitsCount > 0);

  return {
    totalVisits: total,
    completedVisits: booked.length,
    cancelledVisits: filtered.filter((visit) => visit.status === 'cancelled').length,
    occupancyRate: Math.min(100, Math.max(15, total * 12)),
    completionRate: total > 0 ? Math.round((booked.length / total) * 100) : 100,
    activeBarbersCount: barbers.length,
    activeLocationsCount: locations.length,
    totalRevenue: booked.reduce((sum, visit) => sum + (visit.agreedPrice ?? 0), 0),
    barberPerformance,
  };
}
