import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const backend = process.env.API_ORIGIN;
  if (!backend) {
    return NextResponse.json({ visits: [] });
  }
  try {
    const res = await fetch(`${backend}/barber/appointments`, {
      headers: {
        Cookie: request.headers.get('cookie') ?? '',
        Accept: 'application/json',
      },
      redirect: 'manual',
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch (e) {
    return NextResponse.json({ visits: [] }, { status: 502 });
  }
}
