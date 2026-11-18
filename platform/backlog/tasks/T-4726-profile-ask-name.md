# T-4726 · The profile asks for a name when there is none

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4719a
- **StoryPoints**: 8

## What

A client can finish OTP with no name. The cabinet heading then says «Клієнт». The name field is easy to miss under the form.

When the stored name is empty, the account section leads with «Як до вас звертатись?» and the name field. The rest of the profile stays on the page. There is no blocking modal and no skip that writes a placeholder name. The heading stays «Клієнт» until a real name saves (T-4719). After it saves, the prompt is gone.

## Why

The barber and the header otherwise meet a person called «Клієнт» because the profile never asked.

## Sources

- `apps/web/src/app/account/components/AccountShell.tsx`
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5

## Done

- [ ] Slices a, b, and c are `done`
- [ ] An empty name shows the prompt above the field on both surfaces
- [ ] A stored name hides the prompt
- [ ] Nothing writes «Клієнт» back as the name

## Risks

- [ ] **A gate.** The client can still open visits, devices, and the rest of the profile
- [ ] **Inventing a name from the phone.** The phone is not a name

## Out of scope

- The name save rules (T-4719)
- Header initials (T-4715)
