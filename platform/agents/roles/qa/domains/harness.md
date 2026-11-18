---
seat: qa
domain: harness
tag: qa
owns:
  - packages/test-utils
  - apps/api/src/e2e
---

Shared test helpers and the API end-to-end harness. Domain unit tests stay with the seat that owns the domain.
