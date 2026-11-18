# T-4714b · Booking pin in the client app

- **Stage**: M2 (phase 6) · **Tags**: frontend, ux, a11y, mobile · **Complexity**: middle · **Depends on**: T-4714a, T-071
- **StoryPoints**: 5

## What

Build the pin from slice a on the client booking screens in `apps/mobile`.

- The pin reads the booking state those screens already keep. It does not keep a second copy.
- It is hidden before the first decision and on the success screen.
- Earlier-screen chips navigate the same way as the back gesture, including that gesture's clears.
- On the slot screen, choosing a slot fills the time immediately. Changing the date removes it.
- Layout, collapse, safe area, and the bottom button follow slice a.
- Tokens only, through the app theme. No raw colors in the screen. The component stays under the file-size gate.
- If a booking step from T-071 is not on a screen yet, do not invent the step. Pin the summary on the screens that exist and record the missing step in the task note.

## Why

The contract is no use on a website the client is not holding. This slice is the app screen.

## Sources

- T-4714a
- T-071
- `docs/booking-flow.md`
- `apps/mobile`

## Done

- [ ] Slot screen shows location, service, and barber while the list scrolls
- [ ] Choosing a slot shows the time; changing the date clears it
- [ ] A chip and the back gesture open the same screen and drop the same later facts
- [ ] «Будь-який барбер» appears only after the barber screen, and only when no barber was chosen
- [ ] The pin is absent before the first decision and on success
- [ ] Region name «Ваш запис». The chosen time is one polite announcement
- [ ] Tests cover the fact rules, the any-barber label, the chip navigation, and the hidden states
- [ ] Checked in the simulator on a phone-sized screen: the pin clears the status bar, the first slots stay visible, and the bottom button stays in the thumb zone

## Risks

- [ ] **A website header copied into the app.** There is no concierge banner here. Do not add one to make room for the pin
- [ ] **Gesture and chip disagree.** Both must use the flow's existing navigation. A chip that only changes local state will show a fact the screen has already cleared
