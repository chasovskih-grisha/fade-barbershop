import { NextResponse, type NextRequest } from 'next/server';

/** Shared plumbing for account proxy routes: auth, correlation, JSON and upstream errors. */

export function errorResponse(message: string, status: number, correlationId: string) {
  return NextResponse.json(
    { error: message },
    { status, headers: { 'X-Correlation-ID': correlationId } }
  );
}

export function successResponse(data: unknown, correlationId: string) {
  return NextResponse.json(data, { headers: { 'X-Correlation-ID': correlationId } });
}

export function hasCredentials(request: NextRequest): boolean {
  return Boolean(request.headers.get('Authorization') || request.headers.get('Cookie'));
}

export function proxyHeaders(request: NextRequest, correlationId: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-ID': correlationId,
  };
  const auth = request.headers.get('Authorization');
  const cookie = request.headers.get('Cookie');
  if (auth) headers.Authorization = auth;
  if (cookie) headers.Cookie = cookie;
  return headers;
}

export type BodyParseResult = { body: unknown } | { response: ReturnType<typeof errorResponse> };

export async function parseJsonBody(
  request: NextRequest,
  correlationId: string
): Promise<BodyParseResult> {
  try {
    return { body: await request.json() };
  } catch {
    return { response: errorResponse('Invalid JSON body', 400, correlationId) };
  }
}

export function validationError(
  issues: Array<{ message?: string }>,
  fallback: string,
  correlationId: string
) {
  return errorResponse(issues[0]?.message ?? fallback, 400, correlationId);
}

export async function upstreamError(response: Response, fallback: string, correlationId: string) {
  const err = (await response.json().catch(() => ({ message: fallback }))) as {
    message?: string;
  };
  return errorResponse(err.message ?? fallback, response.status, correlationId);
}

export function readQuery(
  request: NextRequest,
  keys: string[]
): Record<string, string | undefined> {
  return Object.fromEntries(
    keys.map((key) => [key, request.nextUrl.searchParams.get(key) ?? undefined])
  );
}
