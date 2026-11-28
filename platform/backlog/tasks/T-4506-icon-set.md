# T-4506 · Icon Set and Vector Assets

- **Stage**: M1 (phase 2) · **Tags**: frontend, design · **Complexity**: junior · **Depends on**: T-004
- **StoryPoints**: 3

## What

Consolidated icon set across web, admin, and mobile (Expo/NativeWind):
- Curated vector icon set (Lucide/Phosphor based or brand custom icons) mapped to design tokens (`packages/design-tokens`).
- Icon component with size, color, and stroke weight variants.
- Documentation in `docs/design-system.md` regarding icon usage rules (sizes, touch targets, monochrome vs colored).

## Why

Consistent iconography across all platforms prevents visual clutter and aligns with brand guidelines (`fade-brand-book.md`).

## Sources

- `docs/design-system.md`, `fade-brand-book.md`

## Done

- [x] `Icon` + `iconPaths` exist in `@fade/ui` and are consumed by web/admin
- [ ] Mobile consumes the same icon set instead of having no icon path
- [ ] Documentation updated in design system guide
- [ ] Build/verify checks for missing icons

## Audit 2026-11-24

Reopened. `packages/ui/src/icons` and `Icon` exist and web/admin import them,
but mobile has no `@fade/ui` or icon dependency and no `Icon` usage.
`docs/design-system.md` has no icon-section reference, and there is no missing-icon
verify gate. “Integrated across web, admin, and mobile” is false.
