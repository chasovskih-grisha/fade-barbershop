# T-2100b · Core Components (5 SP)

- **Stage**: M5 (phase 30) · **Tags**: design · **Complexity**: middle · **Depends on**: T-2100a
- **StoryPoints**: 5

## What

Polish core components: Button, Input, Select, Card, Modal, Toast, Avatar, Badge, StatusPill. Add variants (primary/secondary/ghost/danger), states (hover/focus/disabled/loading), and props.

## Why

Reference components for all screens. Consistent look and behavior. Reuse reduces bugs.

## Sources

- `docs/design-system.md` §Components
- `packages/ui/src/components/`

## Implementation plan

Paths:
- packages/ui/src/Button.tsx
- packages/ui/src/Button.test.tsx

Checks:
- pnpm --filter @fade/ui test packages/ui/src/Button.test.tsx

## Implementation notes

- packages/ui/src/Button.test.tsx
- packages/ui/src/Button.tsx

## QA

- `pnpm --filter @fade/ui test packages/ui/src/Button.test.tsx` exit 0
