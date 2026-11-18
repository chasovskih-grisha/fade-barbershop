# ADR 0004. One mobile app, two roles

- Status: accepted
- Date: 2026-09-07

## Context

Need client app and barber app (calendar, chat). Two apps in App Store / Play — double release, double review, shared chat between two binaries.

## Decision

One Expo app. After login — role navigation `client` or `barber`. User with both roles (rare) chooses mode.

Separate store listings — only if barber UX interferes with client review (then fork, not new data model).

## Consequences

- One push certificate, one deep-link from site.
- Need to strictly cut UI: barber doesn't see foreign screens, client — barber ones.
- Admin remains web, not third mobile role in v1.
