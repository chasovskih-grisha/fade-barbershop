import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getOrCreateCorrelationId } from '@/lib/api/correlation';
import {
  errorResponse,
  hasCredentials,
  parseJsonBody,
  proxyHeaders,
  successResponse,
  upstreamError,
  validationError,
} from '@/lib/api/route-proxy';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const nameSchema = z.object({
  name: z.string({}).min(1, 'Name is required'),
});

export async function PATCH(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    if (!hasCredentials(request)) {
      return errorResponse('Unauthorized', 401, correlationId);
    }

    const parsed = await parseJsonBody(request, correlationId);
    if ('response' in parsed) return parsed.response;

    const result = nameSchema.safeParse(parsed.body);
    if (!result.success) {
      return validationError(result.error.issues, 'Name is required', correlationId);
    }

    const trimmedName = result.data.name.trim();
    if (trimmedName.length === 0) {
      return errorResponse('Name is required', 400, correlationId);
    }

    const res = await fetch(`${API_BASE}/identity/profile/name`, {
      method: 'PATCH',
      headers: proxyHeaders(request, correlationId),
      body: JSON.stringify({ name: trimmedName }),
    });

    if (!res.ok) {
      return upstreamError(res, 'Failed to update name', correlationId);
    }

    return successResponse(await res.json(), correlationId);
  } catch {
    return errorResponse('Internal server error', 500, correlationId);
  }
}
