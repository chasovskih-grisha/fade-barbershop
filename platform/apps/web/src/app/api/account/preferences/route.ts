import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const preferencesSchema = z.object({
  preferences: z
    .array(
      z.string({})
        .min(1, 'Preference cannot be empty')
        .max(100, 'Preference is too long'),
      {}
    )
    .max(20, 'Too many preferences'),
});

export async function PATCH(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');

    if (!authHeader && !cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'X-Correlation-ID': correlationId } });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: { 'X-Correlation-ID': correlationId } });
    }

    if (body && 'preferences' in body) {
      if (!Array.isArray(body.preferences)) {
        return NextResponse.json({ error: 'Expected array' }, { status: 400, headers: { 'X-Correlation-ID': correlationId } });
      }
      for (const p of body.preferences) {
        if (typeof p !== 'string') {
          return NextResponse.json({ error: 'Each preference must be a string' }, { status: 400, headers: { 'X-Correlation-ID': correlationId } });
        }
        if (p === '') {
          return NextResponse.json({ error: 'Preference cannot be empty' }, { status: 400, headers: { 'X-Correlation-ID': correlationId } });
        }
      }
    }

    const result = preferencesSchema.safeParse(body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const errorMessage = issue?.message ?? 'Invalid preferences format';
      return NextResponse.json({ error: errorMessage }, { status: 400, headers: { 'X-Correlation-ID': correlationId } });
    }

    const preferences = result.data.preferences.map((p) => p.trim());

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
    };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const res = await fetch(`${API_BASE}/identity/profile/preferences`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ preferences }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update preferences' }));
      return NextResponse.json({ error: err.message }, { status: res.status, headers: { 'X-Correlation-ID': correlationId } });
    }

    const data = await res.json();
    return NextResponse.json(data, { headers: { 'X-Correlation-ID': correlationId } });
  } catch (err) {
    console.error('Preferences API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: { 'X-Correlation-ID': correlationId } });
  }
}
