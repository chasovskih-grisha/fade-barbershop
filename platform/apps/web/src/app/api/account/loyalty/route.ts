import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const querySchema = z.object({
  includeHistory: z.enum(['true', 'false']).optional().default('false'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
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
      includeHistory: searchParams.get('includeHistory') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    };

    const parseResult = querySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0]?.message ?? 'Invalid query parameters';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const { includeHistory, limit } = parseResult.data;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
    };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const upstreamUrl = new URL(`${API_BASE}/identity/loyalty`);
    upstreamUrl.searchParams.set('includeHistory', includeHistory);
    upstreamUrl.searchParams.set('limit', String(limit));

    const res = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to retrieve loyalty membership info' }));
      return NextResponse.json(
        { error: err.message },
        { status: res.status, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { headers: { 'X-Correlation-ID': correlationId } });
  } catch (err) {
    console.error('Account loyalty API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'X-Correlation-ID': correlationId } }
    );
  }
}
