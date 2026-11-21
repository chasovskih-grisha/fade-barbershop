'use client';

import { useState } from 'react';
import { Button } from '@fade/ui';
import ChairHeatmapCells from './ChairHeatmapCells';
import { DEFAULT_HEATMAP, type ChairHeatmapData } from './chair-heatmap-data';

export type { ChairHeatmapData, HourlyUtilization } from './chair-heatmap-data';

export function ChairUtilizationHeatmap({
  initialData = DEFAULT_HEATMAP,
  onOptimize,
}: {
  initialData?: ChairHeatmapData;
  onOptimize?: () => Promise<void>;
}) {
  const [data, setData] = useState<ChairHeatmapData>(initialData);
  const [optimizing, setOptimizing] = useState(false);
  const [message, setMessage] = useState('');

  const compressGaps = async (): Promise<void> => {
    setOptimizing(true);
    setMessage('');
    try {
      if (onOptimize) {
        await onOptimize();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setData((current) => ({
          ...current,
          overallUtilization: Math.min(0.95, current.overallUtilization + 0.12),
          hourly: current.hourly.map((slot) =>
            slot.status === 'idle'
              ? { ...slot, occupancyRate: 0.7, status: 'optimal' as const, appointmentsCount: 2 }
              : slot
          ),
        }));
      }
      setMessage('✅ Розклад стільця успішно ущільнено! Вільні вікна оптимізовано.');
    } catch {
      setMessage('❌ Помилка під час оптимізації.');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="rounded-card border border-line p-4 space-y-4 bg-surface-base">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-h4 font-bold flex items-center gap-2">
            <span>🪑 Теплова карта завантаження стільця #{data.chairNumber}</span>
            <span className="text-caption font-normal text-fg-muted">({data.barberName})</span>
          </h4>
          <p className="text-caption text-fg-muted mt-0.5">
            Загальна завантаженість за день:{' '}
            <strong className="text-fg">{Math.round(data.overallUtilization * 100)}%</strong>
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() => void compressGaps()}
          disabled={optimizing}
        >
          {optimizing ? 'Ущільнення...' : '⚡ Ущільнити проміжні вікна'}
        </Button>
      </div>

      {message ? (
        <div className="p-3 rounded-input bg-surface-raised text-body text-semantic-success font-medium border border-semantic-success/30">
          {message}
        </div>
      ) : null}

      <ChairHeatmapCells hourly={data.hourly} />

      <div className="flex items-center justify-between text-[11px] text-fg-muted pt-2 border-t border-line">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-surface-raised border border-line"></span>{' '}
            Idle (&lt;40%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-semantic-warning/30"></span> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-semantic-success/30"></span> Optimal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-semantic-success"></span> Peak (&ge;90%)
          </span>
        </div>
        <span>Дата: {data.date}</span>
      </div>
    </div>
  );
}
