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
  includeHistory: z.enum(['true', 'false']).optional().default('false'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    if (!hasCredentials(request)) {
      return errorResponse('Unauthorized', 401, correlationId);
    }

    const rawQuery = readQuery(request, ['includeHistory', 'limit']);
    const parseResult = querySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      return validationError(parseResult.error.issues, 'Invalid query parameters', correlationId);
    }

    const { includeHistory, limit } = parseResult.data;
    const upstreamUrl = new URL(`${API_BASE}/identity/loyalty`);
    upstreamUrl.searchParams.set('includeHistory', includeHistory);
    upstreamUrl.searchParams.set('limit', String(limit));

    const res = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: proxyHeaders(request, correlationId),
    });

    if (!res.ok) {
      return upstreamError(res, 'Failed to retrieve loyalty membership info', correlationId);
    }

    return successResponse(await res.json(), correlationId);
  } catch (err) {
    console.error('Account loyalty API error:', err);
    return errorResponse('Internal server error', 500, correlationId);
  }
}
