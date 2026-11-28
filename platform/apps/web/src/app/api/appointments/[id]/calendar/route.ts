import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';
import { proxyHeaders } from '@/lib/api/route-proxy';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

/**
 * T-4446b: cookie-проксі до `.ics` власного візиту. Браузер не може покласти
 * сесію в `<a download>` на інший origin, тож файл забирає Next і віддає його
 * з того самого домену; API все одно перевіряє, що візит належить клієнту.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const correlationId = getOrCreateCorrelationId(request);
  const { id } = await context.params;

  try {
    const res = await fetch(
      `${API_BASE}/booking/appointments/${encodeURIComponent(id)}/calendar.ics`,
      {
        headers: proxyHeaders(request, correlationId),
        redirect: 'manual',
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Calendar export failed' },
        { status: res.status, headers: { 'x-correlation-id': correlationId } }
      );
    }

    return new NextResponse(await res.text(), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition':
          res.headers.get('content-disposition') ?? `attachment; filename="fade-${id}.ics"`,
        'Cache-Control': 'private, no-store',
        'x-correlation-id': correlationId,
      },
    });
  } catch (err) {
    console.error('Calendar export proxy error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}
