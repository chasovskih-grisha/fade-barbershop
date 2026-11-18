# T-4493 · Payment path correlation trace

- **Stage**: M6 (phase 40) · **Tags**: backend, observability, finance · **Complexity**: middle · **Dependencies**: T-4204, T-091, T-092
- **StoryPoints**: 8

## What

Full trace of payment operation from frontend to provider and back: trace_id generation on payment creation (ICS/3DS/webhook provider), passing into API/logic campaigns (T-4204) and journal (T-4404), correspondence of external provider id to internal, "payment tracing" screen (time, statuses, webhooks, errors) for support, "stuck payment" resolution.

## Why

Payment without trace — "mysterious" for support and for self: did money go, or just webhook didn't arrive; trace removes hours of investigation.

## Requirement sources

- observability.md; billing README; T-4204 (logs), T-091/092 (payments)

## Done

- [ ] trace_id through payment (front → API → provider → webhook)
- [ ] Tracing screen (statuses, webhooks, time) for support
- [ ] Test: stuck webhook correctly marked (resync)

## Risks

- [ ] **Trace sensitivity**: trace_id doesn't contain PAN/personal data (without masking — full trace)
