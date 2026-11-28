import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';
import {
  API_BASE,
  authHeaders,
  choiceOf,
  choiceSchema,
  loadOptions,
  readJson,
} from './usual-chair-io';

// T-4725b: звична локація і барбер профілю. GET віддає збережену пару разом з
// довідниками (локації + барбери обраної локації), PATCH зберігає пару.
// Довідники — ті самі, що читає флоу запису: /locations і /booking/barbers/:id.

/** GET /api/account/usual-chair?locationId=… — пара + довідники. */
export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  const headers = { 'X-Correlation-ID': correlationId, 'Cache-Control': 'no-store' };
  const auth = authHeaders(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });

  try {
    const profileRes = await fetch(`${API_BASE}/identity/profile`, {
      headers: { ...auth, 'X-Correlation-ID': correlationId },
      cache: 'no-store',
    });
    if (!profileRes.ok) {
      return NextResponse.json(
        { error: 'Profile is unavailable' },
        { status: profileRes.status, headers }
      );
    }
    const choice = choiceOf(await readJson(profileRes));
    const requested = request.nextUrl.searchParams.get('locationId');
    const barbersFor = requested !== null ? requested || null : choice.locationId;
    const [locations, barbers] = await Promise.all([
      loadOptions('/locations'),
      barbersFor ? loadOptions(`/booking/barbers/${encodeURIComponent(barbersFor)}`) : [],
    ]);
    return NextResponse.json({ choice, options: { locations, barbers } }, { headers });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}

/** PATCH /api/account/usual-chair — null очищає поле, друге лишається як було. */
export async function PATCH(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  const headers = { 'X-Correlation-ID': correlationId };
  const auth = authHeaders(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });

  try {
    const parsed = choiceSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Location and barber must be ids or empty' },
        { status: 400, headers }
      );
    }
    const res = await fetch(`${API_BASE}/identity/profile/usual-chair`, {
      method: 'PATCH',
      headers: { ...auth, 'Content-Type': 'application/json', 'X-Correlation-ID': correlationId },
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      const err = await readJson(res);
      return NextResponse.json(
        { error: (err?.message as string) ?? 'Failed to update usual chair' },
        { status: res.status, headers }
      );
    }
    return NextResponse.json(await readJson(res), { headers });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
