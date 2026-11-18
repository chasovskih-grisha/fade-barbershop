# T-4711a · Pin the summary in the booking-flow spec

- **Stage**: M1 (phase 4) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4711
- **StoryPoints**: 2

## What

Write the pinned summary into `docs/booking-flow.md`, in the same language as that document, before any component is built. The section applies to screens 1–5. It fixes the facts, the edit behavior, and the placement so the web slice does not invent a second design.

### Facts

Show a fact only when the client has actually decided it. Omit the rest. Do not print placeholders.

| Fact | When it appears | Copy |
|------|-----------------|------|
| Location | `location` is set | Location name |
| Service | `service` is set | Name, duration in minutes, price in ₴, formatted the same way as the service card |
| Mode | A father-son mode was chosen | "Consecutively" or "Simultaneously" |
| Barber | The flow has left the barber step (step ≥ 3) | The barber's name. An empty id at that point is "Any barber". Two parallel barbers are joined with " and ". "Any two available" when that option was chosen |
| When | A slot is chosen | Date and `HH:MM–HH:MM` as one fact. Use "today" or "tomorrow" when that is the date; otherwise a short uk-UA weekday and day.month |

The date in the flow is initialized to today before anyone picks a slot. The pin must not show that date on its own. Changing the date clears the slot, so the when-fact disappears until a new slot is chosen.

An empty barber id on steps 0–2 is not "Any barber". A `?barber=` preselect may show the named barber early, because an id is set. It still must not show the any-barber label before the barber step.

### Edit

Each fact from an earlier step is a button. The accessible name is `Change {fact}, {value}` — for example `Змінити послугу, Чоловіча стрижка, 50 хв, 600 ₴`. Activating it goes to that step through the same setters as Back (`chooseLocation` clears service, barber, and slot; `chooseService` clears the slot; `chooseDate` clears the slot).

The fact for the step the client is on is text, not a button. On the slot step the when-fact fills in as soon as a slot is pressed, and it is not a control.

### Placement

The pin is sticky at the top of the booking column, below the site header, above the step title. If the site header is itself sticky, the pin's offset is the header height so the two do not overlap.

The concierge banner ("Concierge booking", "60 seconds") stays on step 0 only. From the first decision it yields to the pin. Two bars hide the date strip.

Desktop is one row. A narrow viewport wraps to at most two lines. If the facts would be taller than that, collapse to location · service · barber, keep the chosen time visible, and offer "Details" to expand. Do not horizontally scroll a fact off screen.

The footer "Next" stays the bottom sticky action. The pin must not cover the date strip or the first row of slots.

The pin is hidden before the first decision and on the success step. The success card is the record.

### Visual and accessibility

Tokens only: `surface-sunken`, `line`, `fg`, `fg-secondary`, `radius-card`. Depth is the 1px border, not a shadow. Do not fill the pin with `accent.blue`; that color is for AI and `focus-visible`.

The region is named "Your booking". Buttons are at least 44×44. Keyboard order follows the fact order. One polite live announcement when a time becomes chosen (`Selected 14:00–14:30`), not a live region on the whole pin. No entrance motion when reduced motion is requested.

Screen 5 keeps its receipt: reference, comment, and the price breakdown. The pin there is the same compact trail. It does not repeat `FinalPrice`.

Wireframe, using the markers already in `docs/booking-flow.md`:

```
┌──────────────────────────────┐
│ [S] Split · Haircut · 50 min  │  pin, sticky, under the site header
│     Oleksiy · today      │  earlier facts are buttons
│     14:00–14:30              │  when-fact is text on the slot step
│ ← Step 3 · Slot              │
│ [12][13][•14][15] →          │
│  09:00  09:15  [•]  09:45    │
│ [S] [Далі →]                 │  footer stays
└──────────────────────────────┘
```

## Why

The screen spec is the contract for web and, later, the app. Putting the rules in the task only means the next screen change will not know the pin exists.

## Sources

- T-4711
- `docs/booking-flow.md`
- `docs/design-system.md`

## Done

- [ ] `docs/booking-flow.md` has the pinned-summary section, the fact table, the edit rules, and the wireframe
- [ ] The section states what is omitted: empty facts, the uninitialized date, the any-barber label before the barber step, and the price breakdown
- [ ] `pnpm docs:validate` does not report a new error from this file

## Risks

- [ ] **Copying the concierge banner.** The spec must say the banner leaves. A second decorative bar is the failure this slice exists to prevent
