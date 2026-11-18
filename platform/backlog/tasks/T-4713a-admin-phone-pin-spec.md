# T-4713a · Specify the admin phone-booking pin

- **Stage**: M2 (phase 5) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4713
- **StoryPoints**: 2

## What

Add the read-back pin to `docs/admin-screens.md` §6.2, in the language of that document, before the component is built.

### Facts

Show a fact only when the form has a real value. Omit the rest.

| Fact | When | Copy |
|------|------|------|
| Client | Phone step has verified a client | Name if known, otherwise the phone, formatted as the verified card already formats it |
| Location | A location option is selected, not the empty option | Location name |
| Barber | A barber option is selected | Barber name |
| When | A slot is picked | Date and `HH:MM–HH:MM` as one fact. «сьогодні» / «завтра» when that is the date |

Changing the barber or the date clears the slot. The when-fact disappears with it.

There is no service fact. The form does not collect one (`serviceDuration` is fixed). The spec must say the pin does not add one.

### Edit

Each earlier fact is a button the operator can activate without leaving the keyboard.

- «Змінити клієнта, {name or phone}» returns to the phone step. The slot is dropped. The verified client is not kept in the background.
- «Змінити локацію» and «Змінити барбера» focus that select.
- On the slot grid, the when-fact is text, not a button. It fills in when a slot is pressed.

### Placement

The pin is sticky under the admin header, above the form fields, and it does not cover the first row of slots. The create button stays at the bottom of the form.

Region name «Запис для клієнта». One polite live message when a time is chosen: `Обрано 14:00–14:30`. Tokens only. No `accent.blue` fill. The strip is something the operator can read aloud in order: client, place, barber, time.

```
┌──────────────────────────────┐
│ [S] Олексій · +380 67 …      │  verified client
│     Поділ · Тарас            │
│     сьогодні 14:00–14:30     │  after a slot
│ Локація [v]  Барбер [v]      │
│ …слоти…                      │
│ [Створити візит]             │
└──────────────────────────────┘
```

## Why

The public booking spec does not mention a verified client or a form with no service. Copying it would show the wrong facts.

## Sources

- T-4713
- `docs/admin-screens.md` §6.2
- `docs/design-system.md`

## Done

- [ ] §6.2 has the fact table, the client-change rule, and the wireframe
- [ ] The section states that a service is out of the pin until the form has a service field
- [ ] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **The pin becomes a second form.** It reflects the fields. It does not store its own location or slot
