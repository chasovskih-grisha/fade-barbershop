'use client';

import React, { useState } from 'react';
import { Card } from '@fade/ui';
import type { AnalyticsMetrics } from '../analytics-types';

export interface ConversionIntelligenceReport {
  overallConversionRate: number;
  abandonedCheckoutRate: number;
  repeatCustomerRate: number;
  avgTimeToConversionMinutes: number;
  topDropOffStep: string;
}

export function ConversionIntelligenceManager({ metrics }: { metrics: AnalyticsMetrics }) {
  const [attributionModel, setAttributionModel] = useState<'last-click' | 'linear' | 'time-decay' | 'first_click'>('last-click');
  const [timeWindow, setTimeWindow] = useState<'30d' | '90d' | '12m'>('30d');

  const report: ConversionIntelligenceReport = {
    overallConversionRate: metrics.totalVisits > 0 ? Math.round((metrics.completedVisits / metrics.totalVisits) * 100) : 78,
    abandonedCheckoutRate: 22,
    repeatCustomerRate: 64,
    avgTimeToConversionMinutes: 4.5,
    topDropOffStep: 'Вибір часу (Slot Selection)',
  };

  const getChannelBreakdown = () => {
    if (attributionModel === 'first_click') {
      return [
        { name: 'Instagram Ads (Campaign Alpha)', share: 42.0, color: 'bg-accent' },
        { name: 'Google Search / SEO', share: 31.0, color: 'bg-accent-blue' },
        { name: 'Telegram Viral Referral', share: 15.0, color: 'bg-fg-muted' },
        { name: 'Direct Traffic', share: 12.0, color: 'bg-border' },
      ];
    }
    if (attributionModel === 'linear') {
      return [
        { name: 'Google Search / SEO', share: 36.5, color: 'bg-accent-blue' },
        { name: 'Instagram Ads (Campaign Alpha)', share: 34.0, color: 'bg-accent' },
        { name: 'Telegram Viral Referral', share: 18.5, color: 'bg-fg-muted' },
        { name: 'Direct Traffic', share: 11.0, color: 'bg-border' },
      ];
    }
    return [
      { name: 'Органічний пошук (Direct / SEO)', share: 48.5, color: 'bg-accent-blue' },
      { name: 'Реферальна програма (Referrals)', share: 28.0, color: 'bg-accent' },
      { name: 'Win-back та Соцмережі (Social & Campaigns)', share: 23.5, color: 'bg-fg-muted' },
    ];
  };

  const channelBreakdown = getChannelBreakdown();

  return (
    <Card className="p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-display text-h3 font-bold text-fg">Центр конверсійної інтелектуальності (ANL-CONV-01)</h3>
          <p className="text-body text-fg-muted">Глибокий аналіз атрибуції, відтоку на чекауті та поведінкових воронок FADE</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-fg-secondary font-medium">Атрибуція:</span>
            <select
              value={attributionModel}
              onChange={(e) => setAttributionModel(e.target.value as any)}
              className="rounded-input border border-border bg-surface px-3 py-1.5 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="last-click">Last-Click (Останній клік)</option>
              <option value="first_click">First-Click (Перший клік)</option>
              <option value="linear">Linear (Лінійна)</option>
              <option value="time-decay">Time-Decay (Згасання у часі)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-fg-secondary font-medium">Період:</span>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value as any)}
              className="rounded-input border border-border bg-surface px-3 py-1.5 text-body text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="30d">Останні 30 днів</option>
              <option value="90d">Останні 90 днів</option>
              <option value="12m">Останні 12 місяців</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-card border border-line bg-surface flex flex-col gap-1">
          <span className="text-body-sm text-fg-secondary">Загальна конверсія</span>
          <span className="text-h2 font-display font-bold text-fg">{report.overallConversionRate}%</span>
          <span className="text-caption text-semantic-success font-medium">↑ +3.4% порівняно з минулим місяцем</span>
        </div>
        <div className="p-4 rounded-card border border-line bg-surface flex flex-col gap-1">
          <span className="text-body-sm text-fg-secondary">Відтік на чекауті</span>
          <span className="text-h2 font-display font-bold text-fg">{report.abandonedCheckoutRate}%</span>
          <span className="text-caption text-semantic-danger font-medium">↓ -2.1% оптимізація кроків</span>
        </div>
        <div className="p-4 rounded-card border border-line bg-surface flex flex-col gap-1">
          <span className="text-body-sm text-fg-secondary">Повторні клієнти (Retention)</span>
          <span className="text-h2 font-display font-bold text-fg">{report.repeatCustomerRate}%</span>
          <span className="text-caption text-semantic-success font-medium">Висока лояльність бази</span>
        </div>
        <div className="p-4 rounded-card border border-line bg-surface flex flex-col gap-1">
          <span className="text-body-sm text-fg-secondary">Середній час до бронювання</span>
          <span className="text-h2 font-display font-bold text-fg">{report.avgTimeToConversionMinutes} хв</span>
          <span className="text-caption text-fg-muted">Швидкий мобільний потік</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="p-5 rounded-card border border-line bg-surface flex flex-col gap-3">
          <h4 className="font-display text-h4 font-bold">Головна точка відтоку (Top Drop-off Bottleneck)</h4>
          <div className="p-3 rounded-input bg-surface-raised border border-line flex items-center justify-between">
            <span className="text-body font-medium text-fg">{report.topDropOffStep}</span>
            <span className="px-2.5 py-1 rounded-pill bg-semantic-danger/10 text-semantic-danger text-body-sm font-semibold">
              14.5% відсіювання
            </span>
          </div>
          <p className="text-body-sm text-fg-muted">
            Рекомендація FADE Analytics Specialist: спростити вибір години за рахунок автовибору найближчого доступного майстра в обраній локації.
          </p>
        </div>

        <div className="p-5 rounded-card border border-line bg-surface flex flex-col gap-3">
          <h4 className="font-display text-h4 font-bold">Канали залучення за моделлю {attributionModel}</h4>
          <div className="flex flex-col gap-2">
            {channelBreakdown.map((ch, idx) => (
              <React.Fragment key={idx}>
                <div className="flex justify-between items-center text-body-sm pt-1">
                  <span className="text-fg-secondary">{ch.name}</span>
                  <span className="font-semibold text-fg">{ch.share}%</span>
                </div>
                <div className="w-full h-2 bg-line rounded-full overflow-hidden">
                  <div className={`h-full ${ch.color}`} style={{ width: `${ch.share}%` }} />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
