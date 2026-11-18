# T-4869 · The app reads the public barber the website already reads

- **Stage**: M5 (phase 30) · **Tags**: frontend, mobile · **Complexity**: middle · **Depends on**: T-070, T-4852
- **StoryPoints**: 5

## What

The app has no barber client. The booking list already returns `id`, `name`, `any`, `photo`, and `locationName`.

Add a mobile client that loads barbers for a location id and one person by id, using those fields. It does not add biography, specialties, or years the endpoint does not send. It drops the virtual `any` entry. The screen is T-4867, not this task.

## Why

The app slices cannot render a person the client never fetched.

## Sources

- `apps/api/src/booking/dto/barber.dto.ts`
- `apps/web/src/lib/api/staff.ts`
- T-4477a (profile fields that are not on this list yet)

## Done

- [ ] The client returns the public list fields and excludes `any: true`
- [ ] A missing id is not-found, and a failed response is an error
- [ ] A test parses a photo, a null photo, and the virtual any-entry

## Risks

- [ ] **Inventing specialties so the chips have something to press.** If the list has no specialties, T-4853b renders no chips. This client does not fill them in

## Out of scope

- New profile columns (T-4477a)
- The screens (T-4866, T-4867)
