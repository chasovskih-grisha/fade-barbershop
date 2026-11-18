import { NextResponse } from 'next/server';
import { fetchJson } from '@/lib/api/http';

/**
 * GET /api/waitlist/analytics - Waitlist analytics data
 * Returns waitlist metrics and hold history for the dashboard
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start') || '';
    const endDate = searchParams.get('end') || '';
    const locationId = searchParams.get('locationId') || '';
    const serviceId = searchParams.get('serviceId') || '';

    // Fetch waitlist configurations
    const configsResult = await fetchJson<{
      configs: Array<{
        id: string;
        name: string;
        activeCount: number;
        paused: boolean;
        bookNow: boolean;
      }>;
    }>('/scheduling/waitlist/configurations');

    // Fetch hold history
    const holdsPath = `/scheduling/waitlist/hold-history?start=${startDate || 'undefined'}&end=${endDate || 'undefined'}`;
    const holdsResult = await fetchJson<Array<{
      waitingSince: string;
      status: string;
      estimatedWaitTime?: number;
      triggerType?: string;
      fifoCompliant?: boolean;
      cancellationReason?: string;
    }>>(holdsPath);

    // Calculate metrics
    const totalHolders = holdsResult?.length || 0;
    const activeWaitlist = holdsResult?.filter((h: any) => h.status === 'waiting').length || 0;
    const promotedToday = holdsResult?.filter((h: any) => h.status === 'booked').length || 0;
    const promotionRate = totalHolders > 0 ? (promotedToday / totalHolders) * 100 : 0;

    // Wait times
    const waitTimes = holdsResult
      .filter((h: any) => h.estimatedWaitTime !== undefined && h.estimatedWaitTime > 0)
      .map((h: any) => h.estimatedWaitTime || 0);

    const averageWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((sum: number, w: number) => sum + w, 0) / waitTimes.length
      : 0;

    const sortedWaitTimes = [...waitTimes].sort((a: number, b: number) => a - b);
    const medianWaitTime = waitTimes.length > 0
      ? sortedWaitTimes[Math.floor(sortedWaitTimes.length / 2)]
      : 0;

    // Cascade and FIFO metrics
    const cascadeTriggers = holdsResult?.filter((h: any) => h.triggerType === 'cascade').length || 0;
    const fifoCompliant = holdsResult?.filter((h: any) => h.fifoCompliant === true).length || 0;
    const fifoCompliance = totalHolders > 0 ? (fifoCompliant / totalHolders) * 100 : 0;

    // No-show count
    const noShowCount = holdsResult?.filter((h: any) =>
      h.status === 'expired' || h.status === 'cancelled'
    ).length || 0;

    // Slot utilization
    const totalSlots = holdsResult?.reduce((sum: number, h: any) => sum + 1, 0) || 0;
    const filledSlots = holdsResult?.filter((h: any) => h.status === 'booked').length || 0;

    return NextResponse.json({
      success: true,
      metrics: {
        totalHolders,
        activeWaitlist,
        promotedToday,
        promotionRate: Number(promotionRate.toFixed(1)),
        averageWaitTime: Number(averageWaitTime.toFixed(0)),
        medianWaitTime: Number(medianWaitTime.toFixed(0)),
        cascadeTriggers,
        fifoCompliance: Number(fifoCompliance.toFixed(1)),
        noShowCount,
        totalSlots,
        filledSlots: Number(filledSlots),
      },
      holdHistory: (holdsResult || []).map((h: any) => ({
        waitingSince: h.waitingSince,
        status: h.status,
        estimatedWaitTime: h.estimatedWaitTime,
        triggerType: h.triggerType,
        fifoCompliant: h.fifoCompliant,
        cancellationReason: h.cancellationReason,
      })),
      configs: configsResult?.configs || [],
    });
  } catch (error) {
    console.error('Waitlist analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load waitlist analytics' },
      { status: 500 }
    );
  }
}