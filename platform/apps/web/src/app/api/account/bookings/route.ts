import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const querySchema = z.object({
  status: z.enum(['upcoming', 'completed', 'cancelled', 'all']).optional().default('upcoming'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');

    if (!authHeader && !cookieHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawQuery = {
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    };

    const parseResult = querySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0]?.message ?? 'Invalid query parameters';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const { status, limit, offset } = parseResult.data;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
    };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const upstreamUrl = new URL(`${API_BASE}/identity/appointments`);
    upstreamUrl.searchParams.set('status', status);
    upstreamUrl.searchParams.set('limit', String(limit));
    upstreamUrl.searchParams.set('offset', String(offset));

    const res = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to retrieve appointments' }));
      return NextResponse.json(
        { error: err.message },
        { status: res.status, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { headers: { 'X-Correlation-ID': correlationId } });
  } catch (err) {
    console.error('Account bookings API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'X-Correlation-ID': correlationId } }
    );
  }
}
