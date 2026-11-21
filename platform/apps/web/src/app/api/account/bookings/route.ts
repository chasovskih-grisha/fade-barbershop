import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';
import {
  errorResponse,
  hasCredentials,
  proxyHeaders,
  readQuery,
  successResponse,
  upstreamError,
  validationError,
} from '@/lib/api/route-proxy';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const querySchema = z.object({
  status: z.enum(['upcoming', 'completed', 'cancelled', 'all']).optional().default('upcoming'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    if (!hasCredentials(request)) {
      return errorResponse('Unauthorized', 401, correlationId);
    }

    const rawQuery = readQuery(request, ['status', 'limit', 'offset']);
    const parseResult = querySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      return validationError(parseResult.error.issues, 'Invalid query parameters', correlationId);
    }

    const { status, limit, offset } = parseResult.data;
    const upstreamUrl = new URL(`${API_BASE}/identity/appointments`);
    upstreamUrl.searchParams.set('status', status);
    upstreamUrl.searchParams.set('limit', String(limit));
    upstreamUrl.searchParams.set('offset', String(offset));

    const res = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: proxyHeaders(request, correlationId),
    });

    if (!res.ok) {
      return upstreamError(res, 'Failed to retrieve appointments', correlationId);
    }

    return successResponse(await res.json(), correlationId);
  } catch (err) {
    console.error('Account bookings API error:', err);
    return errorResponse('Internal server error', 500, correlationId);
  }
}
