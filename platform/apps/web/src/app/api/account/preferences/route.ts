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

const preferencesSchema = z.object({
  preferences: z
    .array(z.string({}).min(1, 'Preference cannot be empty').max(100, 'Preference is too long'), {})
    .max(20, 'Too many preferences'),
});

type ErrorResponse = ReturnType<typeof errorResponse>;

function validatePreferencesBody(body: unknown, correlationId: string): ErrorResponse | null {
  if (!body || typeof body !== 'object' || !('preferences' in body)) return null;
  const { preferences } = body as { preferences: unknown };
  if (!Array.isArray(preferences)) {
    return errorResponse('Expected array', 400, correlationId);
  }
  const invalid = preferences.find((p) => typeof p !== 'string' || p === '');
  if (invalid !== undefined) {
    const message =
      typeof invalid !== 'string'
        ? 'Each preference must be a string'
        : 'Preference cannot be empty';
    return errorResponse(message, 400, correlationId);
  }
  return null;
}

export async function PATCH(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    if (!hasCredentials(request)) {
      return errorResponse('Unauthorized', 401, correlationId);
    }

    const parsed = await parseJsonBody(request, correlationId);
    if ('response' in parsed) return parsed.response;

    const invalid = validatePreferencesBody(parsed.body, correlationId);
    if (invalid) return invalid;

    const result = preferencesSchema.safeParse(parsed.body);
    if (!result.success) {
      return validationError(result.error.issues, 'Invalid preferences format', correlationId);
    }

    const preferences = result.data.preferences.map((p) => p.trim());
    const res = await fetch(`${API_BASE}/identity/profile/preferences`, {
      method: 'PATCH',
      headers: proxyHeaders(request, correlationId),
      body: JSON.stringify({ preferences }),
    });

    if (!res.ok) {
      return upstreamError(res, 'Failed to update preferences', correlationId);
    }

    return successResponse(await res.json(), correlationId);
  } catch (err) {
    console.error('Preferences API error:', err);
    return errorResponse('Internal server error', 500, correlationId);
  }
}
