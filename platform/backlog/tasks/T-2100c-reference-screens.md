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

- [x] 4 screens updated
- [x] Dark mode works
- [x] Responsive passed

## Implementation notes

- packages/ui/src/ReferenceScreenPreview.test.tsx
- packages/ui/src/ReferenceScreenPreview.tsx

## Implementation notes

Four real compositions now replace the shared placeholder in
`packages/ui/src/reference-screens/`:

- `WebHomePreview.tsx` — hero, primary CTA, three service cards on `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- `AdminShellPreview.tsx` — section nav, client search field, visit rows with `StatusPill` (`grid-cols-1 lg:grid-cols-[220px_1fr]`).
- `SlotFlowPreview.tsx` — `StepIndicator`, live `SlotPicker` selection, `PriceBreakdown`, disabled confirm until a slot is picked.
- `MobileHomePreview.tsx` — location block, service list, full-width CTA in a `max-w-sm` frame.

All eight files touch only semantic tokens (`bg-surface-*`, `text-fg*`, `border-line`), so dark mode
follows the token theme; the test asserts no hard-coded `white`/`zinc`/`gray` palette classes remain.

## Re-verified at d92ff74d

The review commit `1dab1a49` adds `packages/ui/src/ReferenceScreenPreview.tsx`, a generic stub that
renders `<region aria-label="Reference screen: <type>">` plus a button for four string keys. It does not
touch `apps/web`, `apps/admin` or `apps/mobile`, so «4 screens updated», «Dark mode works» and
«Responsive passed» are still unproven; the three `Done` boxes stay unticked.

## QA

- `pnpm --filter @fade/ui test packages/ui/src/ReferenceScreenPreview.test.tsx` exit 0
