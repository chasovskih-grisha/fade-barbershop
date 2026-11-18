---
seat: backend-developer
domain: platform
tag: backend
owns:
  - apps/api/src/app.module.ts
  - apps/api/src/shared
  - apps/api/src/analytics
  - apps/api/src/haircut-ai
  - apps/api/src/onboarding
  - apps/api/src/realtime
  - apps/api/src/seed-admin.ts
  - apps/api/src/seed-admin.spec.ts
  - apps/api/src/seed-customers.ts
  - apps/api/src/seed-customers.fakes.ts
  - apps/api/src/seed-customers.spec.ts
  - apps/api/src/seed-customers-crm.spec.ts
  - apps/api/prisma
  - agents/roles
  - packages/contracts
  - packages/domain-shared
  - packages/migration-framework
---

Shared API kernel, analytics, haircut AI, onboarding, realtime, seeds, contracts, domain-shared, and migrations. Seed specs sit with the seed files.
