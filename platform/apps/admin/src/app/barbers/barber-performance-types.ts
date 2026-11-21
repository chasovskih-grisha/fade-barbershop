export interface VacationRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface BarberPerformanceData {
  appointmentsCount: number;
  revenue: number;
  avgCheck: number;
  utilizationRate: number;
  commissionTier: 'standard' | 'bronze' | 'silver' | 'gold';
  bonusMultiplier: number;
  recommendedAction: string;
  idleGapsMinutes: Array<{ start: string; end: string; durationMinutes: number }>;
  vacationRequests: VacationRequest[];
}
