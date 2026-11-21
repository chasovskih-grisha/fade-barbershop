export interface HourlyUtilization {
  hour: number;
  occupancyRate: number;
  appointmentsCount: number;
  status: 'idle' | 'moderate' | 'optimal' | 'peak';
}

export interface ChairHeatmapData {
  barberId: string;
  barberName: string;
  chairNumber: number;
  date: string;
  hourly: HourlyUtilization[];
  overallUtilization: number;
}

export const DEFAULT_HEATMAP: ChairHeatmapData = {
  barberId: 'barber-1',
  barberName: 'Alex Fade',
  chairNumber: 1,
  date: new Date().toISOString().split('T')[0] ?? '2026-11-12',
  overallUtilization: 0.78,
  hourly: [
    { hour: 9, occupancyRate: 0.3, appointmentsCount: 1, status: 'idle' },
    { hour: 10, occupancyRate: 0.6, appointmentsCount: 2, status: 'moderate' },
    { hour: 11, occupancyRate: 0.9, appointmentsCount: 3, status: 'peak' },
    { hour: 12, occupancyRate: 1.0, appointmentsCount: 4, status: 'peak' },
    { hour: 13, occupancyRate: 0.5, appointmentsCount: 2, status: 'moderate' },
    { hour: 14, occupancyRate: 0.8, appointmentsCount: 3, status: 'optimal' },
    { hour: 15, occupancyRate: 1.0, appointmentsCount: 4, status: 'peak' },
    { hour: 16, occupancyRate: 0.9, appointmentsCount: 3, status: 'peak' },
    { hour: 17, occupancyRate: 0.7, appointmentsCount: 2, status: 'optimal' },
    { hour: 18, occupancyRate: 1.0, appointmentsCount: 4, status: 'peak' },
    { hour: 19, occupancyRate: 0.8, appointmentsCount: 3, status: 'optimal' },
    { hour: 20, occupancyRate: 0.4, appointmentsCount: 1, status: 'idle' },
  ],
};

const CELL_TONES: Record<HourlyUtilization['status'], string> = {
  idle: 'bg-surface-raised text-fg-muted border-line',
  moderate: 'bg-semantic-warning/20 text-fg border-semantic-warning/40',
  optimal: 'bg-semantic-success/20 text-fg border-semantic-success/40',
  peak: 'bg-semantic-success text-fg-inverse font-bold border-semantic-success',
};

export function cellTone(status: HourlyUtilization['status']): string {
  return CELL_TONES[status];
}
