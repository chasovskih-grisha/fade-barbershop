import { cellTone, type HourlyUtilization } from './chair-heatmap-data';

export default function ChairHeatmapCells({ hourly }: { hourly: HourlyUtilization[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 pt-2">
      {hourly.map((slot) => (
        <div
          key={slot.hour}
          className={`rounded-input border p-2.5 text-center flex flex-col justify-between transition-all ${cellTone(slot.status)}`}
          title={`${slot.hour}:00 - Завантаження: ${Math.round(slot.occupancyRate * 100)}% (${slot.appointmentsCount} візитів)`}
        >
          <span className="text-caption font-semibold">{slot.hour}:00</span>
          <div className="my-1">
            <span className="text-h4 font-bold">{Math.round(slot.occupancyRate * 100)}%</span>
          </div>
          <span className="text-[10px] uppercase opacity-80">{slot.status}</span>
        </div>
      ))}
    </div>
  );
}
