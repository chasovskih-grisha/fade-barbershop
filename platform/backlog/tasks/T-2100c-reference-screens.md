# T-2100c · Reference screens (5/20)

- **Stage**: M5 (phase 30) · **Tags**: design · **Complexity**: middle · **Dependencies**: T-2100b
- **StoryPoints**: 5

## What

Update 4 reference screens on new tokens and components: web home, admin shell, slot flow screen, mobile home. Check responsive, a11y, dark mode.

## Why

Reference screens demonstrate system in action. Check on real cases reveals gaps. Gate for UI phases 2–3.

## Requirement sources

- `docs/design-system.md` §Screens
- `apps/web/`, `apps/admin/`, `apps/mobile/`

## Implementation plan

Paths:
- packages/ui/src/ReferenceScreenPreview.tsx
- packages/ui/src/ReferenceScreenPreview.test.tsx

Checks:
- pnpm --filter @fade/ui test packages/ui/src/ReferenceScreenPreview.test.tsx

## Done

- [ ] 4 screens updated
- [ ] Dark mode works
- [ ] Responsive passed

## Implementation notes

- packages/ui/src/ReferenceScreenPreview.test.tsx
- packages/ui/src/ReferenceScreenPreview.tsx
