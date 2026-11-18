# T-4217 · SMS and Email Compliance

- **Stage**: M6 (phase 40) · **Tags**: backend, legal, integration · **Complexity**: middle · **Depends on**: T-3100, T-4202
- **StoryPoints**: 15

## What
Regulatory communications compliance: **TCPA (SMS/USA)** — written consent (opt-in form, checkbox, timestamp), quiet hours (8:00–21:00 recipient local time), STOP/opt-out handling (instant, keyword recognition: STOP/UNSUBSCRIBE/CANCEL/QUIT/END), do-not-call registry scrubbing, consent records retention (4 years), autodialer definition compliance; **CAN-SPAM (Email/USA)** — correct headers, physical mailing address, clear unsubscribe (up to 10 business days), no misleading subject lines, ad labelling; **CASL (Email/Canada)** — express/implied consent, unsubscribe mechanism, sender identification, physical address; **GDPR/ePrivacy (EU/Ukraine)** — consent (free, specific, informed, unambiguous), right to withdraw, DPA with processors, DPIA for profiling; **Ukraine** — Advertising Act, Electronic Communications Act, Diia.Sign for consent recording.

## Why
Legal risks: fines up to $43,280 per SMS (TCPA), €20M / 4% turnover (GDPR). Reputation. Deliverability depends on compliance.

## Sources
- docs/compliance-communications.md — phantom 2026-09-22: file never existed; source accepted at task start
- TCPA / CAN-SPAM / CASL / GDPR / ePrivacy / Ukrainian Law
- Twilio/SendGrid compliance guides

## dependencies
> Slices are allocated at task start; individual subtask files are created then if needed.
