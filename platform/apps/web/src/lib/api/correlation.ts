import { NextRequest } from 'next/server';

export function getOrCreateCorrelationId(request: NextRequest): string {
  return (
    request.headers.get('x-correlation-id') ??
    request.headers.get('x-request-id') ??
    crypto.randomUUID()
  );
}
