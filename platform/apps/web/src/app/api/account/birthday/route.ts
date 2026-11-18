import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';
import { daysInMonth } from '@/app/account/birthday';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const birthdaySchema = z.object({
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(1).max(12),
});

const bodySchema = z.object({ birthday: birthdaySchema.nullable() });

function badRequest(message: string, correlationId: string) {
  return NextResponse.json(
    { error: message },
    { status: 400, headers: { 'X-Correlation-ID': correlationId } }
  );
}

function unauthorized(correlationId: string) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401, headers: { 'X-Correlation-ID': correlationId } }
  );
}

/** PATCH /api/account/birthday (T-4730b): день і місяць без року; null очищає. */
export async function PATCH(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    if (!authHeader && !cookieHeader) return unauthorized(correlationId);

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return badRequest('Day and month are required', correlationId);

    const { birthday } = parsed.data;
    if (birthday && birthday.day > daysInMonth(birthday.month)) {
      return badRequest('Impossible day and month', correlationId);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
    };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const res = await fetch(`${API_BASE}/identity/profile/birthday`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ birthday }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update birthday' }));
      return NextResponse.json(
        { error: err.message },
        { status: res.status, headers: { 'X-Correlation-ID': correlationId } }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'X-Correlation-ID': correlationId } });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'X-Correlation-ID': correlationId } }
    );
  }
}
