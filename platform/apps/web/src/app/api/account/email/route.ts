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

const emailSchema = z.object({
  email: z.string({}).min(1, 'Email address is required'),
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    if (!hasCredentials(request)) {
      return errorResponse('Unauthorized', 401, correlationId);
    }

    const parsed = await parseJsonBody(request, correlationId);
    if ('response' in parsed) return parsed.response;

    const result = emailSchema.safeParse(parsed.body);
    if (!result.success) {
      return validationError(result.error.issues, 'Email address is required', correlationId);
    }

    const cleanEmail = result.data.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      return errorResponse('Invalid email address format', 400, correlationId);
    }

    const res = await fetch(`${API_BASE}/identity/profile/email`, {
      method: 'PATCH',
      headers: proxyHeaders(request, correlationId),
      body: JSON.stringify({ email: cleanEmail }),
    });

    if (!res.ok) {
      return upstreamError(res, 'Failed to update email address', correlationId);
    }

    return successResponse(await res.json(), correlationId);
  } catch {
    return errorResponse('Internal server error', 500, correlationId);
  }
}
