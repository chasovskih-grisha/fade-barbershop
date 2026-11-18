# T-132 · Full Journey Test Pass on Production Integrations

- **Stage**: M3 · **Tags**: integration · **Complexity**: middle · **Depends on**: T-131, all M1–M3 tasks
- **StoryPoints**: 5

## What

Guest → booking → deposit → visit → `complete` → review → (loyalty, if Slice included) — on **production** integrations (acquiring, Checkbox, push, SMS). Regression of GWT scenarios in `booking-flow-tests.md` (all 8) + acceptance of AC gates for phases M1–M3 in `traceability.md`.

## Sources

- `roadmap.md` v1 checklist (test pass); `booking-flow-tests.md`; traceability gates

## Done

- [ ] Full journey passed without manual data interventions
- [ ] M1–M3 AC gates "accepted"

## Risks

- [ ] **Regression coverage**: all v1 AC groups in traceability have a run
