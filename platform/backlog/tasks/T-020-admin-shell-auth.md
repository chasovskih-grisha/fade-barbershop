# T-020 · Admin Shell and Login admin.fade.com.ua

- **Stage**: M1 (phase 2) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-001, T-011, T-012
- **StoryPoints**: 5

## What

Scaffold `apps/admin`: sidebar (all sections from `admin-screens.md` §0), header with location filter, login on `admin.fade.com.ua` via separate cookie. General screen rules: tables with filter bars, empty states, confirmation on destructive actions, error messages, skeletons. Permission model: UI hides, **API checks** (access matrix §16).

## Why

Phase 2 scaffold upon which all 15 admin sections are built; gate `MNG-ADM-18`.

## Sources

- `admin-screens.md` §0 (shell, rules) and §16 (access matrix)
- `products.md` §2 (separate domain, separate session); roadmap checklist v1

## Done

- [x] Admin login works; public OTP clients do not have access
- [x] Empty scaffold with navigation to all sections

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
