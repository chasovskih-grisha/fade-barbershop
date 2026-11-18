# T-4715a · Specify the header account mark

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, a11y · **Complexity**: junior · **Depends on**: T-4715
- **StoryPoints**: 2

## What

Add a section «Шапка: вхід і кабінет» to `docs/web-screens.md`. The rest of that file stays as it is. The section records only the account control.

### Signed out

The control is the person icon. Its accessible name is «Увійти». It links to `/login`.

When the current page is a public content page (`/`, `/locations`, `/services`, `/barbers`, `/blog`, and their children), the link is `/login?next=` that path. `safeNextPath` already rejects an external or protocol-relative `next`. The header must not build a value that helper would drop.

On `/booking` and under `/account`, omit `next`. A booking draft lives in client state, and returning to `/booking` would show an empty flow. Login already falls back to `/account/appointments`.

### Signed in

The control is a circle with the client's initials, from the existing `Avatar` (size `sm`, no image, no status). The accessible name is «Кабінет, {ім'я}». The link is `/account`.

An empty name keeps the person glyph inside the circle. The accessible name is then «Кабінет». The circle is the difference from the signed-out icon. Do not invent a name from the phone number.

### Both

- While the session is still loading, render the signed-out control.
- The mobile menu row uses the same destination. Signed out, the row says «Увійти». Signed in, it says «Кабінет» and the name when there is one.
- Phone, the five nav items, and «Записатися» do not change.
- Tokens only. `accent.blue` stays a focus ring, not a fill on the mark.

## Why

The header is a server component and the session arrives on the client. Without a written rule, the first paint will show one client and then another.

## Sources

- T-4715
- `docs/web-screens.md`
- `apps/web/src/app/login/useLoginActions.ts` (`safeNextPath`)
- `packages/ui/src/Avatar.tsx`

## Done

- [ ] The section states the three states: loading, signed out, signed in
- [ ] It names which pages pass `next`, and that `/booking` does not
- [ ] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **Restoring the missing screen spec.** `web-screens.md` says its body is absent. This slice adds one section. It does not rewrite §0
