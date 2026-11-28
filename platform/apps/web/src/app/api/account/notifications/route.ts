import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';
import {
  fromApiPreferences,
  toApiPreferences,
  type ApiNotificationPreferences,
  type NotificationPreferences,
} from '@/app/account/notification-preferences';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const preferencesSchema = z.object({
  smsReminders: z.boolean(),
  emailUpdates: z.boolean(),
  pushNotifications: z.boolean(),
  marketingOffers: z.boolean(),
});

function proxyHeaders(request: NextRequest, correlationId: string): Record<string, string> | null {
  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('Cookie');
  if (!authHeader && !cookieHeader) return null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-ID': correlationId,
  };
  if (authHeader) headers['Authorization'] = authHeader;
  if (cookieHeader) headers['Cookie'] = cookieHeader;
  return headers;
}

async function resolveClientId(headers: Record<string, string>): Promise<string | null> {
  const res = await fetch(`${API_BASE}/identity/profile`, { headers, cache: 'no-store' });
  if (!res.ok) return null;
  const profile: { id?: unknown } = await res.json().catch(() => ({}));
  return typeof profile.id === 'string' ? profile.id : null;
}

function reply(payload: unknown, status: number, correlationId: string) {
  return NextResponse.json(payload, { status, headers: { 'X-Correlation-ID': correlationId } });
}

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  const headers = proxyHeaders(request, correlationId);
  if (!headers) return reply({ error: 'Unauthorized' }, 401, correlationId);

  try {
    const clientId = await resolveClientId(headers);
    if (!clientId) return reply({ error: 'Unauthorized' }, 401, correlationId);

    const res = await fetch(`${API_BASE}/client/notifications/preferences/${clientId}`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) return reply({ error: 'Failed to load notifications' }, res.status, correlationId);

    const data = (await res.json()) as ApiNotificationPreferences;
    return reply(fromApiPreferences(data), 200, correlationId);
  } catch {
    return reply({ error: 'Internal server error' }, 500, correlationId);
  }
}

export async function PATCH(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  const headers = proxyHeaders(request, correlationId);
  if (!headers) return reply({ error: 'Unauthorized' }, 401, correlationId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ error: 'Invalid JSON body' }, 400, correlationId);
  }

  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return reply(
      { error: parsed.error.issues[0]?.message ?? 'Invalid notifications' },
      400,
      correlationId
    );
  }

  try {
    const clientId = await resolveClientId(headers);
    if (!clientId) return reply({ error: 'Unauthorized' }, 401, correlationId);

    const res = await fetch(`${API_BASE}/client/notifications/preferences/${clientId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(toApiPreferences(parsed.data as NotificationPreferences)),
    });
    if (!res.ok) return reply({ error: 'Failed to save notifications' }, res.status, correlationId);

    const data = (await res.json()) as ApiNotificationPreferences;
    return reply(fromApiPreferences(data), 200, correlationId);
  } catch {
    return reply({ error: 'Internal server error' }, 500, correlationId);
  }
}
