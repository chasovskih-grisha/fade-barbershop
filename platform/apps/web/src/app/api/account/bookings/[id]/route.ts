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

const rescheduleSchema = z.object({
  action: z.literal('reschedule'),
  newSlotId: z.string().min(1, 'New slot ID is required'),
  newDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
});

const cancelSchema = z.object({
  action: z.literal('cancel'),
  reason: z.string().max(500).optional(),
});

const patchSchema = z.discriminatedUnion('action', [rescheduleSchema, cancelSchema]);

type ActionPayload = z.infer<typeof patchSchema>;
type UpstreamRequest = { url: string; method: string; body: unknown };

function toUpstreamRequest(payload: ActionPayload, bookingId: string): UpstreamRequest {
  const baseUrl = `${API_BASE}/identity/appointments/${bookingId}`;
  if (payload.action === 'cancel') {
    return {
      url: `${baseUrl}/cancel`,
      method: 'POST',
      body: { reason: payload.reason },
    };
  }
  return {
    url: `${baseUrl}/reschedule`,
    method: 'POST',
    body: { slotId: payload.newSlotId, date: payload.newDate },
  };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const correlationId = getOrCreateCorrelationId(request);
  const { id: bookingId } = await context.params;

  try {
    if (!hasCredentials(request)) {
      return errorResponse('Unauthorized', 401, correlationId);
    }

    const parsed = await parseJsonBody(request, correlationId);
    if ('response' in parsed) return parsed.response;

    const result = patchSchema.safeParse(parsed.body);
    if (!result.success) {
      return validationError(result.error.issues, 'Invalid request payload', correlationId);
    }

    const upstream = toUpstreamRequest(result.data, bookingId);
    const res = await fetch(upstream.url, {
      method: upstream.method,
      headers: proxyHeaders(request, correlationId),
      body: JSON.stringify(upstream.body),
    });

    if (!res.ok) {
      return upstreamError(res, 'Failed to process appointment action', correlationId);
    }

    return successResponse(await res.json().catch(() => ({ success: true })), correlationId);
  } catch (err) {
    console.error('Booking patch/action API error:', err);
    return errorResponse('Internal server error', 500, correlationId);
  }
}
