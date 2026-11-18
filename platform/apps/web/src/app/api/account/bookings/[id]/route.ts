import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const rescheduleSchema = z.object({
  action: z.literal('reschedule'),
  newSlotId: z.string().min(1, 'New slot ID is required'),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
});

const cancelSchema = z.object({
  action: z.literal('cancel'),
  reason: z.string().max(500).optional(),
});

const patchSchema = z.discriminatedUnion('action', [rescheduleSchema, cancelSchema]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const correlationId = getOrCreateCorrelationId(request);
  const { id: bookingId } = await context.params;

  try {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');

    if (!authHeader && !cookieHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const parseResult = patchSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0]?.message ?? 'Invalid request payload';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const payload = parseResult.data;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
    };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    let upstreamEndpoint = `${API_BASE}/identity/appointments/${bookingId}`;
    let upstreamMethod = 'PATCH';
    let upstreamBody: any = payload;

    if (payload.action === 'cancel') {
      upstreamEndpoint = `${API_BASE}/identity/appointments/${bookingId}/cancel`;
      upstreamMethod = 'POST';
      upstreamBody = { reason: payload.reason };
    } else if (payload.action === 'reschedule') {
      upstreamEndpoint = `${API_BASE}/identity/appointments/${bookingId}/reschedule`;
      upstreamMethod = 'POST';
      upstreamBody = { slotId: payload.newSlotId, date: payload.newDate };
    }

    const res = await fetch(upstreamEndpoint, {
      method: upstreamMethod,
      headers,
      body: JSON.stringify(upstreamBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to process appointment action' }));
      return NextResponse.json(
        { error: err.message },
        { status: res.status, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { headers: { 'X-Correlation-ID': correlationId } });
  } catch (err) {
    console.error('Booking patch/action API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'X-Correlation-ID': correlationId } }
    );
  }
}
