/* eslint-disable max-lines, complexity, max-statements -- cohesive module (107 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: generateReport, complexity 16 vs 10); refactor tracked in T-2500f | 1 method with a single orchestration flow (worst: generateReport, 33 statements vs 30); extraction tracked in T-2500f */
/**
 * FADE Conversion Attribution & Traffic Source Analyzer
 * Analyzes conversion funnels and revenue across different acquisition channels (organic, referral, campaign, social, direct).
 */

import { FunnelEventRecord } from './conversion-funnel-tracker';

export type AcquisitionChannel = 'ORGANIC' | 'REFERRAL' | 'CAMPAIGN' | 'SOCIAL' | 'DIRECT';

export interface AttributedSession {
  sessionId: string;
  clientId?: string;
  channel: AcquisitionChannel;
  campaignCode?: string;
  revenue: number;
  completed: boolean;
  events: FunnelEventRecord[];
}

export interface ChannelPerformanceMetrics {
  channel: AcquisitionChannel;
  totalSessions: number;
  completedBookings: number;
  conversionRatePercent: number;
  totalRevenue: number;
  averageRevenuePerBooking: number;
}

export interface AttributionReport {
  channels: ChannelPerformanceMetrics[];
  topChannel: AcquisitionChannel | null;
  overallAttributedRevenue: number;
  insights: string[];
}

export class ConversionAttributionAnalyzer {
  private sessions: AttributedSession[] = [];

  constructor(sessions: AttributedSession[] = []) {
    this.sessions = [...sessions];
  }

  public addSession(session: AttributedSession): void {
    this.sessions.push(session);
  }

  public generateReport(): AttributionReport {
    const channelMap = new Map<
      AcquisitionChannel,
      { sessions: number; completed: number; revenue: number }
    >();

    for (const ch of [
      'ORGANIC',
      'REFERRAL',
      'CAMPAIGN',
      'SOCIAL',
      'DIRECT',
    ] as AcquisitionChannel[]) {
      channelMap.set(ch, { sessions: 0, completed: 0, revenue: 0 });
    }

    let overallAttributedRevenue = 0;

    for (const s of this.sessions) {
      const stats = channelMap.get(s.channel) || { sessions: 0, completed: 0, revenue: 0 };
      stats.sessions += 1;
      if (s.completed) {
        stats.completed += 1;
        stats.revenue += s.revenue;
        overallAttributedRevenue += s.revenue;
      }
      channelMap.set(s.channel, stats);
    }

    const channels: ChannelPerformanceMetrics[] = [];
    let topChannel: AcquisitionChannel | null = null;
    let maxRevenue = -1;

    for (const [channel, stats] of channelMap.entries()) {
      const conversionRatePercent =
        stats.sessions > 0 ? Number(((stats.completed / stats.sessions) * 100).toFixed(2)) : 0;
      const averageRevenuePerBooking =
        stats.completed > 0 ? Number((stats.revenue / stats.completed).toFixed(2)) : 0;

      if (stats.revenue > maxRevenue && stats.revenue > 0) {
        maxRevenue = stats.revenue;
        topChannel = channel;
      }

      channels.push({
        channel,
        totalSessions: stats.sessions,
        completedBookings: stats.completed,
        conversionRatePercent,
        totalRevenue: stats.revenue,
        averageRevenuePerBooking,
      });
    }

    const insights: string[] = [];
    if (topChannel) {
      insights.push(
        `Top performing acquisition channel by revenue is ${topChannel} with UAH ${maxRevenue} generated.`
      );
    }

    const referralStats = channelMap.get('REFERRAL');
    if (referralStats && referralStats.completed > 0) {
      insights.push(
        `Referral program has generated ${referralStats.completed} completed bookings with high organic advocacy.`
      );
    }

    const campaignStats = channelMap.get('CAMPAIGN');
    if (campaignStats && campaignStats.sessions > 0) {
      const campConv =
        campaignStats.sessions > 0 ? (campaignStats.completed / campaignStats.sessions) * 100 : 0;
      insights.push(
        `Win-back campaigns achieved ${campConv.toFixed(1)}% conversion rate across ${campaignStats.sessions} targeted sessions.`
      );
    }

    return {
      channels,
      topChannel,
      overallAttributedRevenue,
      insights,
    };
  }
}
