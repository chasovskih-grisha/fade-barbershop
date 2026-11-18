export type AnalyticsPeriod = 'day' | 'week' | 'month';

export interface AnalyticsFiltersState {
  period: AnalyticsPeriod;
  locationId: string;
  barberId: string;
}

export interface BarberPerformanceDto {
  barberId: string;
  barberName: string;
  visitsCount: number;
  revenue: number;
}

export interface AnalyticsMetrics {
  totalVisits: number;
  completedVisits: number;
  cancelledVisits: number;
  occupancyRate: number; // percentage 0-100
  completionRate: number; // percentage 0-100
  activeBarbersCount: number;
  activeLocationsCount: number;
  totalRevenue: number;
  barberPerformance: BarberPerformanceDto[];
}
