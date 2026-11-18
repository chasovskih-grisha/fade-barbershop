# T-4509d · Mobile Shared Layer + Live Kit Verification (2/13)

- **Stage**: M2 (phase 6) · **Tags**: frontend, design, mobile · **Complexity**: junior · **Depends on**: T-4509a, T-4509b, T-4509c
- **StoryPoints**: 2

## What

Final Slice: shared folder `apps/mobile/ui/` (kit), example screen for manual verification of all components, cleanup of duplicate StyleSheet definitions, testing on iOS + Android simulators, vertical flow walkthrough: shell → OTP seed → slot → price. Establish component README in `docs/components/` for mobile primitives.

## Why

Without a shared catalog, UI primitives drift across screens; without a reference showcase screen, layout regressions go unnoticed. This Slice prepares the kit for T-070.

## Sources

- `apps/mobile/ui/` (new folder, AGENTS gate: new catalog requires coverage-matrix entry)
- `docs/components/README.md` (documentation pattern)
- `docs/ux-guidelines.md` §States; `docs/client-screens.md`

## Done

- [ - ] `apps/mobile/ui/` structured; component showcase mounted
- [ - ] Verified on iOS + Android simulators (rendering, dark mode, status bar)
- [ - ] Component README created for mobile; coverage-matrix updated

## Risks

- [ - ] NativeWind version constraints — deliberately keeping the catalog restricted to essential primitives only (YAGNI)
