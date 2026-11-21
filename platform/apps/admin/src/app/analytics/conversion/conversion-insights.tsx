'use client';

import { Fragment } from 'react';
import { channelBreakdown, type AttributionModel } from './conversion-channels';
import type { ConversionIntelligenceReport } from './conversion-report';

export default function ConversionInsights({
  report,
  attributionModel,
}: {
  report: ConversionIntelligenceReport;
  attributionModel: AttributionModel;
}) {
  const channels = channelBreakdown(attributionModel);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
      <div className="p-5 rounded-card border border-line bg-surface flex flex-col gap-3">
        <h4 className="font-display text-h4 font-bold">
          Головна точка відтоку (Top Drop-off Bottleneck)
        </h4>
        <div className="p-3 rounded-input bg-surface-raised border border-line flex items-center justify-between">
          <span className="text-body font-medium text-fg">{report.topDropOffStep}</span>
          <span className="px-2.5 py-1 rounded-pill bg-semantic-danger/10 text-semantic-danger text-body-sm font-semibold">
            14.5% відсіювання
          </span>
        </div>
        <p className="text-body-sm text-fg-muted">
          Рекомендація FADE Analytics Specialist: спростити вибір години за рахунок автовибору
          найближчого доступного майстра в обраній локації.
        </p>
      </div>

      <div className="p-5 rounded-card border border-line bg-surface flex flex-col gap-3">
        <h4 className="font-display text-h4 font-bold">
          Канали залучення за моделлю {attributionModel}
        </h4>
        <div className="flex flex-col gap-2">
          {channels.map((channel, index) => (
            <Fragment key={index}>
              <div className="flex justify-between items-center text-body-sm pt-1">
                <span className="text-fg-secondary">{channel.name}</span>
                <span className="font-semibold text-fg">{channel.share}%</span>
              </div>
              <div className="w-full h-2 bg-line rounded-full overflow-hidden">
                <div className={`h-full ${channel.color}`} style={{ width: `${channel.share}%` }} />
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
