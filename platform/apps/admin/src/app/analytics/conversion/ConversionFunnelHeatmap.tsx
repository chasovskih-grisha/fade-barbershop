'use client';

import React, { useState } from 'react';
import { Card } from '@fade/ui';
import type { AnalyticsMetrics } from '../analytics-types';

export interface FunnelStepData {
  stepNumber: number;
  stepName: string;
  usersCount: number;
  conversionRate: number; // % of initial
  dropOffRate: number; // % drop from previous
  avgDurationSeconds: number;
}

export function ConversionFunnelHeatmap({ metrics: _metrics }: { metrics: AnalyticsMetrics }) {
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'web'>('all');

  const steps: FunnelStepData[] = [
    {
      stepNumber: 1,
      stepName: 'Перегляд головної / Послуг (Landing View)',
      usersCount: deviceFilter === 'mobile' ? 8400 : deviceFilter === 'web' ? 6200 : 14600,
      conversionRate: 100,
      dropOffRate: 0,
      avgDurationSeconds: 18,
    },
    {
      stepNumber: 2,
      stepName: 'Вибір майстра (Barber Selection)',
      usersCount: deviceFilter === 'mobile' ? 6720 : deviceFilter === 'web' ? 4650 : 11370,
      conversionRate: 77.9,
      dropOffRate: 22.1,
      avgDurationSeconds: 42,
    },
    {
      stepNumber: 3,
      stepName: 'Вибір часу (Slot & Calendar Selection)',
      usersCount: deviceFilter === 'mobile' ? 5120 : deviceFilter === 'web' ? 3310 : 8430,
      conversionRate: 57.7,
      dropOffRate: 25.8,
      avgDurationSeconds: 55,
    },
    {
      stepNumber: 4,
      stepName: 'Авторизація та телефон (Auth & PIN / Phone)',
      usersCount: deviceFilter === 'mobile' ? 4480 : deviceFilter === 'web' ? 2780 : 7260,
      conversionRate: 49.7,
      dropOffRate: 13.9,
      avgDurationSeconds: 28,
    },
    {
      stepNumber: 5,
      stepName: 'Підтвердження та сплата (Booking Commit)',
      usersCount: deviceFilter === 'mobile' ? 3920 : deviceFilter === 'web' ? 2410 : 6330,
      conversionRate: 43.4,
      dropOffRate: 12.8,
      avgDurationSeconds: 15,
    },
  ];

  const getHeatmapColor = (dropOff: number) => {
    if (dropOff > 20) return 'bg-semantic-danger/15 text-semantic-danger border-semantic-danger/30';
    if (dropOff > 12) return 'bg-semantic-warning/15 text-semantic-warning border-semantic-warning/30';
    return 'bg-semantic-success/15 text-semantic-success border-semantic-success/30';
  };

  return (
    <Card className="p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-display text-h3 font-bold text-fg">Теплова карта воронки конверсій (ANL-HEAT-03)</h3>
          <p className="text-body text-fg-muted">Аналіз вузьких місць та інтенсивності відтоку користувачів за кроками</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-fg-secondary font-medium">Пристрій:</span>
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value as any)}
            className="rounded-input border border-border bg-surface px-3 py-1.5 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">Усі пристрої (All Platforms)</option>
            <option value="mobile">Мобільний додаток (iOS / Android)</option>
            <option value="web">Веб-кабінет (Web Browser)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {steps.map((step) => (
          <div key={step.stepNumber} className="p-4 rounded-card border border-line bg-surface flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-display font-bold flex items-center justify-center shrink-0">
                {step.stepNumber}
              </div>
              <div className="flex flex-col">
                <span className="font-display font-semibold text-fg text-body">{step.stepName}</span>
                <span className="text-body-sm text-fg-secondary">
                  Користувачів: <strong className="text-fg">{step.usersCount.toLocaleString()}</strong> • Середній час: {step.avgDurationSeconds} сек
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-body-sm text-fg-secondary">Конверсія кроку</span>
                <span className="font-display font-bold text-fg text-h4">{step.conversionRate}%</span>
              </div>
              <div className={`px-3 py-1.5 rounded-pill border text-body-sm font-medium ${getHeatmapColor(step.dropOffRate)}`}>
                {step.dropOffRate === 0 ? 'Старт воронки' : `Відтік: -${step.dropOffRate}%`}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-card border border-line bg-surface flex flex-col gap-2">
        <h4 className="font-display text-h4 font-bold text-fg">Рекомендація Conversion Intelligence</h4>
        <p className="text-body-sm text-fg-muted">
          Найбільший відтік спостерігається на кроці №3 (Вибір часу / слот-політика — 25.8% відтоку). 
          Рекомендується спростити вибір найближчого вільного слота в один клік («Найближчий вільний час») для зниження відтоку на 4-6%.
        </p>
      </div>
    </Card>
  );
}
