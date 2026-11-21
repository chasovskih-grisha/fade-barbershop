import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const avatarSchema = z.object({
  avatarUrl: z.string({}).url('Invalid avatar URL format'),
});

export async function PATCH(request: NextRequest) {
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const result = avatarSchema.safeParse(body);
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message ?? 'Avatar URL is required';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400, headers: { 'X-Correlation-ID': correlationId } }
      );
    }

    const avatarUrl = result.data.avatarUrl.trim();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
    };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const res = await fetch(`${API_BASE}/identity/profile/avatar`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ avatarUrl }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update avatar URL' }));
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
