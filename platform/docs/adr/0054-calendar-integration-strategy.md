# ADR 0054: Calendar Integration Strategy (ICS v1, OAuth post-v1)

## Status
Accepted

## Context
Barbers need visibility into their FADE schedule in external calendars (Google Calendar, Apple Calendar, Outlook).
Two competing approaches exist:
1. Static ICS export (`GET /calendar/export.ics?barberId=...&token=...`) — read-only, 5 min cache, token-authenticated, zero external sync infra.
2. Two-way OAuth synchronization (Google Calendar / Microsoft 365 API) — complex conflict resolution, high maintenance.

## Decision
- Implement **ICS export (v1)** as the sole calendar integration for v1.
- Define OAuth bidirectional synchronization as post-v1 scope.
- Enforce unguessable access token per barber for `GET /calendar/export.ics`.

## Consequences
- Clean separation of concerns; zero external API quota dependency for v1.
- Barbers get standard read-only calendar feed supported by all major calendar providers.
