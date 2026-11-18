# T-4588 · Consent Management & Privacy Compliance (GDPR, Amplitude)

- **Stage**: M3 (before phase 3 — website) · **Tags**: frontend, backend, legal, analytics, privacy · **Complexity**: middle · **Depends on**: T-4402, T-4575, T-4576
- **StoryPoints**: 3

## What

Analytics consent implementation (cookie banner T-4402) for Amplitude: lazy initialization of SDK, opt-out mechanism, data deletion requests, PII scrubbing before event transmission.

## Why

Legal compliance (GDPR/local privacy laws) and respecting user privacy choices.

## Sources

- T-4402 (cookie banner), T-4575 (Amplitude)
- Legal requirements review

## Done

- [ ] Amplitude does not initialize before user consent
- [ ] Opt-out revokes tracking and clears local storage state
- [ ] PII scrubbing middleware filters phone numbers and emails

## Risks

- [ ] **Consent state sync**: cookie consent state must synchronize correctly across domains and server sessions.
