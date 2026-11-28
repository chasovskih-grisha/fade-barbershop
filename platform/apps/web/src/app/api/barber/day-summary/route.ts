import { NextRequest, NextResponse } from 'next/server';

/** Проксі до GET /barber/payments/day-summary: cookie сесії їде як є. */
export async function GET(request: NextRequest) {
  const backend = process.env.API_ORIGIN;
  if (!backend) return NextResponse.json({ error: 'api_unavailable' }, { status: 502 });

  const date = request.nextUrl.searchParams.get('date') ?? '';
  try {
    const res = await fetch(
      `${backend}/barber/payments/day-summary?date=${encodeURIComponent(date)}`,
      {
        headers: {
          Cookie: request.headers.get('cookie') ?? '',
          Accept: 'application/json',
        },
        redirect: 'manual',
      }
    );
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'api_unreachable' }, { status: 502 });
  }
}
