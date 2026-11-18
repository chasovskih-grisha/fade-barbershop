---
id: T-4623
title: "Automated Fraud Detection & Risk Scoring for Online Bookings"
status: todo
sp: 8
priority: high
category: security, fraud-prevention, payments
phase: 14
milestone: M3
source: "docs/security-hardening.md, cancellation-policy-optimization.md"
adr: [0005, 0012]
screens: ["web-screens.md", "admin-screens.md"]
---

# T-4623: Automated Fraud Detection & Risk Scoring for Online Bookings

## Overview

High-demand slots and promotional launches can attract fraudulent bookings, bot-driven slot hoarding, or stolen credit card testing. Without automated risk scoring, no-show rates spike and legitimate clients are blocked from booking prime weekend slots.

This task implements a modular risk-scoring engine that evaluates IP reputation, device fingerprinting, phone carrier validation, and booking velocity to trigger mandatory deposit holds or CAPTCHA verification for high-risk attempts.

## Scope

- **Risk Scoring Pipeline**: Score each booking request (0-100) based on device entropy, IP geolocation vs. phone country code, email domain age, and booking frequency.
- **Dynamic Deposit Enforcement**: Automatically mandate a 50% deposit hold for bookings exceeding a risk threshold (score > 65), overriding standard pay-at-shop policies.
- **Admin Flagging & Review Queue**: Surface flagged high-risk bookings in the admin cabinet with clear risk factors and one-click ban/approve controls.
- **IP Rate Limiting & Fingerprinting**: Integrate invisible browser fingerprinting headers on `book.fade.com.ua` to detect automated scripts.

## Why

Protecting chair capacity from bots and fraudulent no-shows preserves revenue integrity and ensures fair access for loyal clients.

## Sources

- `docs/security-hardening.md`
- `docs/cancellation-policy-optimization.md`
- ADR 0005 (Identity and security principles)

## Done

- [ ] Risk scoring microservice evaluates booking metadata in <50ms
- [ ] High-risk bookings successfully trigger mandatory deposit payment flow
- [ ] Admin cabinet displays risk badges and review queue for flagged appointments
- [ ] Integration tests verify rate limiting blocks automated flood attempts

## Risks

- [ ] **False positives blocking legitimate first-time clients.** Mitigation: Set conservative thresholds and provide frictionless OTP fallback.
- [ ] **Privacy compliance (GDPR/local regulations).** Ensure device fingerprinting hashes data securely without storing raw PII in analytics logs.

## Out of scope

- Third-party enterprise fraud APIs (Sift/MaxMind) — using internal heuristic rules and carrier checks for v1
- Chargeback automated dispute management
