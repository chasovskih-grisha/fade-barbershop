# T-2400a · Role Model (5/15)

- **Stage**: M5 (phase 30) · **Tags**: backend, security · **Complexity**: middle · **Depends on**: T-012
- **StoryPoints**: 5

## What
Create `AdminRole` table: super-admin, manager, barber. Add fields: access permissions (JSON), description, priority. Add migration and seeders for initial roles.

## Why
Foundations of the role system. Allows creating new roles without changing code. Migration ensures data validity.

## Sources
- ADR 0027 (admin role model; status **proposed** — decision at task start; source of truth v1: identity README + AC 04)
- `prisma/schema.prisma`

## Done
- [ ] Table created
- [ ] Migration added
- [ ] Seeders configured
