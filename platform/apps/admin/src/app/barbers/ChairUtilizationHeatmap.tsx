'use client';

import React, { useState } from 'react';
import { Button } from '@fade/ui';

export interface HourlyUtilization {
  hour: number; // e.g., 9 to 20
  occupancyRate: number; // 0.0 to 1.0
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

const DEFAULT_HEATMAP: ChairHeatmapData = {
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

  const handleCompressGaps = async () => {
    setOptimizing(true);
    setMessage('');
    try {
      if (onOptimize) {
        await onOptimize();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        // Simulate optimizing gaps by boosting idle slots
        setData((prev) => ({
          ...prev,
          overallUtilization: Math.min(0.95, prev.overallUtilization + 0.12),
          hourly: prev.hourly.map((h) =>
            h.status === 'idle'
              ? { ...h, occupancyRate: 0.7, status: 'optimal' as const, appointmentsCount: 2 }
              : h
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

  const getCellColor = (status: HourlyUtilization['status']) => {
    switch (status) {
      case 'idle':
        return 'bg-surface-raised text-fg-muted border-line';
      case 'moderate':
        return 'bg-semantic-warning/20 text-fg border-semantic-warning/40';
      case 'optimal':
        return 'bg-semantic-success/20 text-fg border-semantic-success/40';
      case 'peak':
        return 'bg-semantic-success text-fg-inverse font-bold border-semantic-success';
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
            Загальна завантаженість за день: <strong className="text-fg">{Math.round(data.overallUtilization * 100)}%</strong>
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={handleCompressGaps} disabled={optimizing}>
          {optimizing ? 'Ущільнення...' : '⚡ Ущільнити проміжні вікна'}
        </Button>
      </div>

      {message && (
        <div className="p-3 rounded-input bg-surface-raised text-body text-semantic-success font-medium border border-semantic-success/30">
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 pt-2">
        {data.hourly.map((slot) => (
          <div
            key={slot.hour}
            className={`rounded-input border p-2.5 text-center flex flex-col justify-between transition-all ${getCellColor(
              slot.status
            )}`}
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

      <div className="flex items-center justify-between text-[11px] text-fg-muted pt-2 border-t border-line">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-surface-raised border border-line"></span> Idle (&lt;40%)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-semantic-warning/30"></span> Moderate</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-semantic-success/30"></span> Optimal</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-semantic-success"></span> Peak (&ge;90%)</span>
        </div>
        <span>Дата: {data.date}</span>
      </div>
    </div>
  );
}
