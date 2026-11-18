# T-4740b · Reschedule and cancel on the app visit

- **Stage**: M2 (phase 10) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4740a, T-4737b
- **StoryPoints**: 8

## What

Add «Перенести» and «Скасувати» to an upcoming row in the app. Reschedule picks a slot through the same validation the website form uses. Cancel confirms with the T-4737 sentences. Both call the existing client commands. Completed and cancelled rows do not show the buttons. After the buttons exist, the header may say the client can reschedule.

## Why

The row is where the client looks. The website forms are the behavior to reuse.

## Sources

- T-4740a
- `apps/mobile/src/app/(client)/account/appointments/list-item.tsx`
- `apps/web/src/app/account/appointments/RescheduleForm.tsx`
- `apps/web/src/app/account/appointments/CancelVisitDialog.tsx`

## Done

- [ ] Upcoming visits show both actions
- [ ] Completed visits show neither
- [ ] Cancel with no deposit does not mention a deposit

## Risks

- [ ] **A local-only cancel.** The button calls the API. Closing the dialog is not the cancel
