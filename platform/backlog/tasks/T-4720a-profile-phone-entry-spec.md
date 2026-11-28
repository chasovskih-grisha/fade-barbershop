# T-4720a · Specify where the phone change sits on the profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4720, T-4620b
- **StoryPoints**: 2

## What

In `docs/web-cabinet-screens.md` §2, replace the support hint with the profile entry for the existing change.

- The phone is read-only.
- "Change number" opens the flow T-4620b already specified: new number, code, collision without naming the other person, success returns to sign-in.
- `docs/client-screens.md` §5 points at that paragraph. It does not describe a different success.
- The support sentence is gone from both docs.

## Why

§2 still tells the client to call support. §5 says the change is a new OTP. The profile cannot follow both.

## Sources

- T-4720
- T-4620b
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5

## Done

- [x] §2 names the existing flow and drops the support sentence — «Правило номера» (T-4720) and the «Змінити номер» entry in «Акаунт»
- [x] §5 points at §2 — «той самий флоу, що в кабінеті: … «Правило номера»»
- [x] `pnpm docs:validate` reports no new error from these files (7 pre-existing errors unchanged: 6× status «qa», 1× unescaped `|` in m5)

## Risks

- [ ] **Rewriting T-4620b.** This slice only places that flow on the profile. It does not change the success rule
