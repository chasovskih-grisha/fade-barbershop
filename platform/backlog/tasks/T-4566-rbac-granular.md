# T-4566 · RBAC: granular permissions for Founder/Admin/Receptionist/Barber/Client

- **Stage**: M2 (phase 5-8) · **Tags**: backend, security · **Complexity**: middle · **Depends on**: T-012, T-020, T-2400a, T-4486, T-4544, T-4547, T-4565
- **StoryPoints**: 8

## What

Гранулярна RBAC система (розширення T-012/020/2400a/4486):
- **Roles**: FOUNDER (owner), ADMIN (manager), RECEPTIONIST, BARBER, CLIENT
- **Permissions** (resource:action): clients:view/create/edit/archive/merge/import/export, appointments:view/create/edit/cancel/reschedule/complete/no_show, payments:view/create/refund/report, services:view/create/edit/price, schedule:view/edit/manage_own/manage_all, inventory:view/create/edit/audit, analytics:view/kpi/reports/export, marketing:campaigns/create/send/analytics, loyalty:view/manage/rules, settings:view/edit (global/location), users:manage_roles/manage_permissions
- **Permission matrix** (default):
  - FOUNDER: all permissions
  - ADMIN: all except users:manage_roles (тільки FOUNDER), settings:global (read-only)
  - RECEPTIONIST: clients:view/create/edit, appointments:view/create/edit/cancel/reschedule, payments:view/create, schedule:view, loyalty:view
  - BARBER: appointments:view_own/edit_own_status/complete_own/no_show_own, clients:view_own_appointments, schedule:manage_own, services:view_own
  - CLIENT: appointments:view_own/create_own/cancel_own/reschedule_own, profile:view_own/edit_own, loyalty:view_own, payments:view_own, gift_cards:view_own
- **Location scoping**: для мережі (M6) — permissions scoped до локацій користувача (location_manager role T-105)
- **API enforcement**: policy-based authorization (Casbin або custom) в guards/interceptors
- **UI enforcement**: приховування/дизайблінг елементів по permissions (frontend guard HOC)
- **Audit**: зміна ролей/пермішнів логується в T-4565

## Why

Безпека, принцип least privilege, розділення відповідальності при масштабуванні команди.

## Sources

- T-012 (roles), T-020 (admin shell), T-2400a (roles ADR 0027), T-4486 (location manager), T-4544 (CRM), T-4547 (team), T-4565 (audit)
- Canvas: "Canonical client/barber/admin as v1 truth; resolve proposed AdminRole and location_manager semantics before phase 9"
- Altegio: role uprawnienia, granualarne uprawnienia, zakresy lokalizacji

## Done

- [ ] Permission registry: enum `Permission`, `RolePermissionMatrix` (default + overrides)
- [ ] Authorization guard: `@RequirePermission('clients:edit')` на controller/usecase level
- [ ] Frontend: `usePermissions()` hook, `<Can permission="...">` component wrapper
- [ ] Admin UI: Role Manager (CRUD ролей, матриця пермішнів, location scoping)
- [ ] Migration: існуючі role checks → permission checks
- [ ] Tests: matrix coverage (кожна роль + кожен ресурс = allow/deny)

## Risks

- [ ] **Over-engineering**: v1 — фіксована матриця, dynamic permissions — post-v1 (M6/M7)
- [ ] **Location scoping complexity**: M6 добавить location_id в permission context