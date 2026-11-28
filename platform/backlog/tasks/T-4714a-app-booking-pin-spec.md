# T-4714a · Specify the app booking pin

- **Stage**: M2 (phase 6) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4714, T-4711a
- **StoryPoints**: 2

## What

Add an app subsection to the mobile differences in `docs/booking-flow.md`. It does not rewrite the fact table from T-4711a. It says the app uses that table, and it records only what is different on a phone.

### Same as the website

Facts, omission rules, «Будь-який барбер» only after the barber screen, the date shown only together with a chosen slot, father-son mode when that step happened, and no price breakdown. Chips for earlier screens call the same navigation as the back gesture, including the clears that gesture already performs. The fact for the screen the client is on is text. The success screen has no pin.

### Different on the app

- The pin sits under the step progress, inside the safe area, above the screen title.
- One row. If it would wrap past two lines, collapse to location · service · barber and keep the chosen time on its own line. «Деталі» expands the rest. No horizontal scroller that clips a fact.
- The primary button stays at the bottom, clear of the home indicator.
- Touch targets are at least 44 points.
- The back gesture remains. The pin is a second way to an earlier screen, not a replacement.
- Region name «Ваш запис». One polite announcement when a time is chosen: `Обрано 14:00–14:30`.
- No entrance motion when reduced motion is on.

```
┌──────────────────────────────┐
│ Крок 3/5                     │
│ [S] Поділ · Стрижка · Олексій│
│     сьогодні 14:00–14:30     │
│ Оберіть час                  │
│ 09:00                        │
│ 09:15                        │
│ [Далі]                       │  bottom, thumb zone
└──────────────────────────────┘
```

## Why

A copied website spec misses the safe area, the back gesture, and the bottom button. A rewritten fact table will drift from the site.

## Sources

- T-4714
- T-4711a
- `docs/booking-flow.md`
- `docs/design-system.md`

## Done

- [x] The mobile section points at the T-4711a fact rules and lists only the app differences
- [x] The wireframe shows the pin under the progress and the button at the bottom
- [x] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **Two contracts.** If a fact rule changes, it changes in T-4711a. This slice does not restate it in different words
