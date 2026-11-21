import type { BarberPerformanceData } from './use-barber-performance';

const STATS: Array<{
  label: string;
  value: (data: BarberPerformanceData) => string;
  tone?: string;
}> = [
  {
    label: 'Завершено візитів',
    value: (data: BarberPerformanceData) => String(data.appointmentsCount),
  },
  {
    label: 'Виручка',
    value: (data: BarberPerformanceData) => `${data.revenue} ₴`,
    tone: 'text-semantic-success',
  },
  { label: 'Середній чек', value: (data: BarberPerformanceData) => `${data.avgCheck} ₴` },
  {
    label: 'Завантаженість (Utilization)',
    value: (data: BarberPerformanceData) => `${Math.round(data.utilizationRate * 100)}%`,
  },
];

export default function BarberPerformanceStats({ data }: { data: BarberPerformanceData }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-input border border-line p-3 bg-surface-base">
            <p className="text-caption text-fg-muted">{stat.label}</p>
            <p className={`text-h4 font-bold mt-1 ${stat.tone ?? ''}`}>{stat.value(data)}</p>
          </div>
        ))}
      </div>
      <div className="rounded-input bg-surface-raised p-3 text-body text-fg">
        <strong>Рекомендація оптимізації:</strong> {data.recommendedAction}
      </div>
    </>
  );
}
