# T-4737b · Cancel dialog states only a known consequence

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4737a
- **StoryPoints**: 5

## What

Update `CancelVisitDialog` to the three cases. Read the deposit and the window from the visit object the dialog already receives. Do not fetch billing. If those fields are not on the visit type yet, add them as optional and treat absence as the quiet case. The confirm button still calls `onConfirm`.

## Why

The dialog is the only cancel confirm on the website.

## Sources

- T-4737a
- `apps/web/src/app/account/appointments/CancelVisitDialog.tsx`

## Done

- [x] Tests cover no deposit, inside the window, outside the window, and a missing window
- [x] None of those tests call a refund

## Risks

- [ ] **Computing the window in the component from a global constant.** Pass the visit's own deadline or window. The component does not assume four hours
