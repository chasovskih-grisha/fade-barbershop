---
id: T-5007
title: "AI Voice Concierge & Automated Phone Booking Agent"
status: todo
sp: 13
priority: high
category: ai, voice, booking, integration
phase: 50
milestone: M10
source: "docs/booking-flow.md, admin-screens.md, architecture.md"
adr: [0012, 0019]
screens: ["admin-screens.md", "web-screens.md"]
---

# T-5007: AI Voice Concierge & Automated Phone Booking Agent

## Overview

A significant percentage of high-value appointments in premium barbershops still originate from inbound phone calls, especially from VIP clients and callers outside digital booking channels. During peak hours, front-desk staff are often busy serving clients in chairs, leading to missed calls, lost revenue, and uncaptured walk-in demand.

This task implements an AI Voice Concierge service using Whisper STT, LLM-driven intent parsing, and Text-to-Speech (TTS) telephony integration (Twilio / SIP trunking) to handle inbound voice calls 24/7, check real-time availability slots, book appointments, answer pricing and location FAQs, and send SMS confirmations.

## Scope

- **Telephony Webhook & SIP Integration**: Twilio Voice webhooks for inbound call routing, recording, and real-time audio streaming.
- **Speech-to-Text & Intent Parser**: Low-latency STT pipeline with domain-specific vocabulary (barber names, haircut types, Ukrainian/English/Russian terminology).
- **Slot Availability & Booking Execution**: Direct integration with the booking engine (`T-040`, `T-041`) to check real-time chair availability and execute idempotent bookings.
- **SMS & Confirmation Dispatch**: Instant booking confirmation and calendar invite dispatch via Twilio SMS (`T-080`).
- **Human Handover & Escalation**: Intelligent fallback to front-desk staff if intent confidence is low or client requests human assistance.

## Acceptance Criteria

1. Inbound calls are answered within 2 seconds with a natural synthesized greeting matching the brand voice.
2. The AI correctly parses barber preference, service type, and time requests with >95% accuracy for domain terms.
3. Successfully creates bookings in the core database with correct slot reservation and sends SMS confirmation within 15 seconds of call completion.
4. Gracefully escalates complex queries or irate callers to the physical location phone queue with complete call context logged in the CRM notes (`T-060`).
