# T-4715b · Header account mark on the website

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, a11y · **Complexity**: middle · **Depends on**: T-4715a
- **StoryPoints**: 5

## What

Build the account control from slice a in `SiteHeader` and `MobileNav`.

- The control is a client child. It reads `useAuth`. The rest of the header stays a server component: wordmark, nav, phone, «Записатися».
- Signed out and while `isLoading`, render the person icon, name «Увійти», and the login href from slice a.
- Signed in, render `Avatar` with `name`, size `sm`, no `src`, no `status`, and `aria-hidden`. The link's accessible name and href follow slice a.
- The mobile row uses the same href and the visible words from slice a.
- Update `PublicShell` tests. With no session the link is «Увійти». With a user named «Олексій Коваль» the link is «Кабінет, Олексій Коваль» and points at `/account`.

## Why

The spec is no use while every page still shows one icon.

## Sources

- T-4715a
- `apps/web/src/app/components/shell/SiteHeader.tsx`
- `apps/web/src/app/components/shell/MobileNav.tsx`
- `apps/web/src/app/components/shell/__tests__/PublicShell.test.tsx`

## Done

- [ ] Signed out, desktop and the mobile menu offer «Увійти»
- [ ] Signed in, both show the initials and open `/account`
- [ ] A public page passes `next`. `/booking` does not
- [ ] The existing shell tests cover both states

## Risks

- [ ] **The header becomes a client component.** Only the account control needs the session. Phone and nav stay server-rendered
