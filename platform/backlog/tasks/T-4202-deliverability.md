# T-4202 · Email and SMS Deliverability

- **Stage**: M5 (phase 30) · **Tags**: backend, integration, high-risk · **Complexity**: senior · **Depends on**: T-3100
- **StoryPoints**: 18

## What
Deliverability infrastructure: setup DKIM/SPF/DMARC (signing, alignment, reports), bounce/complaint handling (webhook from provider → suppression list), provider fallbacks (SendGrid → Mailgun → Postmark for email; Twilio → Vonage → Plivo for SMS), template preview and test sending, reputation monitoring (Google Postmaster, Microsoft SNDS, SenderScore), warm-up schedule for new IPs/domains, list hygiene (suppressing inactive users), unsubscribe headers (List-Unsubscribe, RFC 8058).

## Why
Transactional emails must reach the Inbox. Domain reputation is critical. Fallback ensures reliability.

## Sources
- docs/deliverability.md — phantom 2026-09-22: file never existed; source is accepted at task start
- RFC 5322, 6376, 7489
- Twilio/SendGrid docs

## dependencies
> Slices are defined upon task start; separate subtask files are created then if needed.
