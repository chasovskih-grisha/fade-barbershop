import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

// Сесія — cookie fadoidx (не "session"). Вихід має відкликати її на API
// і прокинути Set-Cookie очищення, інакше кабінет лишається відкритим.
export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  const upstream = await fetch(`${API_BASE}/identity/logout`, {
    method: 'POST',
    headers: {
      cookie: request.headers.get('cookie') ?? '',
      'X-Correlation-ID': correlationId,
    },
  });
  const response = NextResponse.json(
    { success: upstream.ok },
    { status: upstream.ok ? 200 : upstream.status, headers: { 'X-Correlation-ID': correlationId } }
  );
  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append('set-cookie', cookie);
  }
  return response;
}
