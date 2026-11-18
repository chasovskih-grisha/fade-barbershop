# T-4509c · Mobile Flow Primitives: Slot / Price / Status (3/13)

- **Stage**: M2 (phase 6) · **Tags**: frontend, design, mobile · **Complexity**: middle · **Depends on**: T-4509a
- **StoryPoints**: 3

## What
Mobile booking flow primitives on NativeWind: SlotPicker (slot grid), PriceBreakdown (price/deposit/discount, reference in T-044/T-092 snapshot), StatusPill (for service/visit status map), StepIndicator (flow steps), Tabs (client shell tab bar) and gallery (GalleryTile when needed). States: empty from `booking-flow.md` (no slots — EmptyState), error.

## Why
T-071 (booking), T-072 (visits + statuses) require these exact primitives; they carry domain states (deposit, visit status) which must render identically in web and mobile. Status patterns share a single source — the token status map.

## Sources
- `docs/booking-flow.md` steps 3–4 (slot selection, price)
- `docs/components/SlotPicker.md`, `PriceBreakdown.md`, `StatusPill.md`, `StepIndicator.md`
- `docs/design-system.md` §Tokens (status map); `docs/ux-guidelines.md` §States

## Done
- [x] SlotPicker/PriceBreakdown/StatusPill/StepIndicator/Tabs on NativeWind tokens
- [x] "No slots" scenario → EmptyState; deposit shown as part of the price
- [x] Unit tests; flow verification in simulator (Tabs navigation)
