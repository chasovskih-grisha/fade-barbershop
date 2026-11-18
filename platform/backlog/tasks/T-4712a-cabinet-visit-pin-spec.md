# T-4712a · Specify the cabinet visit pin

- **Stage**: M1 (phase 4) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4712
- **StoryPoints**: 2

## What

Add the cabinet pin to `docs/client-screens.md` §4, in the language of that document, before the component is built.

### Where

The pin is the first region of the reschedule dialog and of the reference editor on `/account/appointments`. It stays above the inputs. It is not a page header and not the visit list card.

### Facts

| Fact | Reschedule | Reference edit |
|------|------------|----------------|
| Location | Name, when the visit has one | Same |
| Service | Name | Same |
| Barber | Name | Same |
| Зараз | Booked date and `HH:MM–HH:MM`. «сьогодні» / «завтра» when that is the date | Same |
| Новий час | Only after the entered start fits the same duration on that day | Never |

Empty facts are omitted. Do not print placeholders.

If the visit is waiting on a deposit, one line: «Депозит переноситься». No amount, no breakdown.

### What it is not

The pin does not edit the visit. Confirm and dismiss stay in the dialog footer. The pin is not a button back into the booking flow. Changing location, service, or barber is out of reschedule.

### Visual and accessibility

Tokens only: `surface-sunken`, `line`, `fg`, `fg-secondary`, `radius-card`. No `accent.blue` fill. Region name «Цей візит». The new time, when it appears, is one polite live message: `Новий час 14:00–14:30`. Buttons in the pin are not required; these facts are not steps to reopen.

```
┌──────────────────────────────┐
│ Цей візит                    │
│ Поділ · Стрижка · Олексій    │
│ Зараз · сьогодні 14:00–14:30 │
│ Новий час · пт 18.11 16:00   │  only after a valid start
│ Дата [____]  Початок [____]  │
│ [Скасувати]  [Перенести]     │
└──────────────────────────────┘
```

## Why

Without the section, the dialog will grow a second summary that disagrees with the list card.

## Sources

- T-4712
- `docs/client-screens.md` §4
- `docs/design-system.md`

## Done

- [ ] §4 describes the pin, the two times, the deposit line, and the reference-editor case
- [ ] The section says the pin does not repeat `FinalPrice` and does not navigate
- [ ] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **Spec copied from T-4711.** Those chips jump back to a step. These facts do not. The section has to say so
