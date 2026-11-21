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

const phoneSchema = z.object({
  phone: z.string({}).min(1, 'Phone number is required'),
});

const PHONE_PATTERN = /^\+?[1-9]\d{1,14}$/;

export async function PATCH(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  try {
    if (!hasCredentials(request)) {
      return errorResponse('Unauthorized', 401, correlationId);
    }

    const parsed = await parseJsonBody(request, correlationId);
    if ('response' in parsed) return parsed.response;

    const result = phoneSchema.safeParse(parsed.body);
    if (!result.success) {
      return validationError(result.error.issues, 'Phone number is required', correlationId);
    }

    const cleanPhone = result.data.phone.trim().replace(/[\s()-]/g, '');
    if (!PHONE_PATTERN.test(cleanPhone)) {
      return errorResponse('Invalid phone number format', 400, correlationId);
    }

    const res = await fetch(`${API_BASE}/identity/profile/phone`, {
      method: 'PATCH',
      headers: proxyHeaders(request, correlationId),
      body: JSON.stringify({ phone: cleanPhone }),
    });

    if (!res.ok) {
      return upstreamError(res, 'Failed to update phone number', correlationId);
    }

    return successResponse(await res.json(), correlationId);
  } catch {
    return errorResponse('Internal server error', 500, correlationId);
  }
}
