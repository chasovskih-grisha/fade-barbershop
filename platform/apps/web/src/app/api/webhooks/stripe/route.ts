import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const API_BASE = process.env.WEB_API_URL ?? process.env.API_ORIGIN ?? 'http://localhost:13000';

const webhookSchema = z.object({
  id: z.string().min(1, 'Webhook ID is required'),
  type: z.string().min(1, 'Webhook type is required'),
  data: z.record(z.string(), z.any()).optional(),
});

type WebhookEvent = z.infer<typeof webhookSchema>;

// Simple in-memory idempotency cache for webhooks in server runtime
const processedEvents = new Set<string>();

async function parseWebhookBody(
  request: NextRequest
): Promise<{ body: unknown } | { response: NextResponse }> {
  try {
    return { body: await request.json() };
  } catch {
    return { response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }
}

async function forwardToBackend(event: WebhookEvent): Promise<NextResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/billing/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    if (res.ok) return null;

    const errData = (await res.json().catch(() => ({ error: 'Webhook processing failed' }))) as {
      error?: string;
    };
    return NextResponse.json(
      { error: errData.error ?? 'Webhook processing failed' },
      { status: res.status }
    );
  } catch {
    // Backend offline: keep the resilience policy — mark as processed and respond 200.
    return null;
  }
}

function rememberEvent(id: string): void {
  processedEvents.add(id);
  if (processedEvents.size > 10000) {
    const firstItem = processedEvents.values().next().value;
    if (firstItem) processedEvents.delete(firstItem);
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseWebhookBody(request);
    if ('response' in parsed) return parsed.response;

    const parseResult = webhookSchema.safeParse(parsed.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message ?? 'Invalid webhook payload';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const event = parseResult.data;
    if (processedEvents.has(event.id)) {
      return NextResponse.json({ received: true, status: 'already_processed' }, { status: 200 });
    }

    const failure = await forwardToBackend(event);
    if (failure) return failure;

    rememberEvent(event.id);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
