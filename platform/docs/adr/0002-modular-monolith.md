# ADR 0002. Modular monolith, not microservices

- Status: accepted
- Date: 2026-09-07

## Context

Several bounded contexts and three clients. Temptation: service per context.

Team small. Network small. DDD skill directly says: don't spawn services for folders.

## Decision

One API process. Contexts — modules with own `domain/application/infrastructure` and Postgres schemas.

Microservice — only after proof: separate release cycle, separate load, or separate team.

## Consequences

- Simpler transactions within context, simpler deploy.
- Boundary discipline held by code review and rules, not network.
- Realtime chat lives in same process (WebSocket + Redis), not in separate chat cluster.
