import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    const cookieHeader = request.headers.get('Cookie');

    if (!cookieHeader) {
      return NextResponse.json({ user: null }, { status: 200, headers: { 'X-Correlation-ID': correlationId } });
    }

    const res = await fetch(`${API_BASE}/identity/profile`, {
      headers: {
        Cookie: cookieHeader,
        'X-Correlation-ID': correlationId,
      },
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401) {
        return NextResponse.json({ user: null }, { status: 200, headers: { 'X-Correlation-ID': correlationId } });
      }
      const err = await res.json().catch(() => ({ message: 'Failed to get profile' }));
      return NextResponse.json({ error: err.message }, { status: res.status, headers: { 'X-Correlation-ID': correlationId } });
    }

    const data = await res.json();
    return NextResponse.json({ user: data }, { headers: { 'X-Correlation-ID': correlationId } });
  } catch {
    return NextResponse.json({ user: null }, { status: 200, headers: { 'X-Correlation-ID': correlationId } });
  }
}
