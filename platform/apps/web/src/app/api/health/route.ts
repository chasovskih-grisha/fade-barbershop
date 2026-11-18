import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  const healthData = {
    status: 'healthy',
    service: 'fade-web',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV ?? 'development',
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'X-Correlation-ID': correlationId,
    },
  });
}
