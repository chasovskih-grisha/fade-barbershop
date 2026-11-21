# Admin panel UI/UX audit — 2026-11-20 (T-2101c)

Measured audit of `apps/admin/src` against `docs/admin-screens.md` and
`docs/ux-guidelines.md`. Numbers are a grep of the tree on 2026-11-20, not estimates.
This slice writes the findings; fixes go to the owners named in §4.

## 1. Size

| Measure | Value |
|---------|------:|
| Screens (`page.tsx`) | 27 |
| Files (`*.ts` + `*.tsx`) | 335 |
| Files over 100 LOC (ADR 0019) | 14 |
| Largest screens | `app/reputation/page.tsx` 484, `app/referrals/page.tsx` 416, `app/cash/page.tsx` 289, `app/waitlist/page.tsx` 248 |

Every screen over the limit is a screen that mixes layout, data and form state. The
LOC gate is red for these files, so the audit names them rather than hiding them.

## 2. Design tokens

| Measure | Value |
|---------|------:|
| Hex colours in admin sources | 1 |
| `px` literals in admin sources | 15 |
| Files using `focus-visible` | 17 |

The token rule (`docs/review-checklist.md` §5) holds almost everywhere: one hex and
fifteen `px` literals are the whole debt. The 17 files with `focus-visible` cover the
shared primitives; screens that build controls locally do not get it for free.

## 3. Accessibility

| Measure | Value |
|---------|------:|
| `role=` attributes | 55 |
| `aria-*` attributes | 134 |
| `aria-live` regions | 2 |
| `<label htmlFor>` pairs | 10 |
| Files with `<input>` and no `aria-invalid` | 31 |
| `loading.tsx` files | 0 |
| `error.tsx` files | 2 |

Three findings, in order of risk:

1. **No `loading.tsx` anywhere.** Every admin route blocks on data with no skeleton,
   while the client site and the app already ship them (T-4825). Staff see a frozen
   table instead of a state.
2. **31 of the forms can fail without saying so.** `aria-invalid` is absent, so a
   screen reader user gets no signal that a field was rejected; only 2 `aria-live`
   regions exist in the whole panel, so a save error is not announced at all.
3. **Two error boundaries for 27 screens.** A thrown render error blanks the route.

## 4. Owners for the fixes

| Finding | Owner |
|---------|-------|
| Screens over 100 LOC | T-2101a/T-2101b siblings' rule; split the screen, not the gate |
| Missing skeletons | T-4513 (empty/error/loading states), pattern from T-4825 |
| `aria-invalid` and announcements | T-4510 / T-4510a (a11y harness), T-4507 (form primitives) |
| Local controls instead of `packages/ui` | T-4507 / T-4507d |
| Detail pages that repeat list layout | T-4525, T-4526, T-4527 |

No new tasks are opened here: every finding already has an owner in the index.

## 5. What this slice does not claim

- No screen was opened in a browser for this audit; it is a source audit.
- The 15 `px` literals and the single hex were not fixed — that is the primitives work
  above, not an audit.
- Colour contrast was not measured; axe-core in CI is T-4510a.
