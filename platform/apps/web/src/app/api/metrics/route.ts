import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  const metricsData = {
    service: 'fade-web',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    nodeVersion: process.version,
  };

  return NextResponse.json(metricsData, {
    status: 200,
    headers: {
      'X-Correlation-ID': correlationId,
    },
  });
}
