# T-4719b · Refresh the session after the name saves

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4719a
- **StoryPoints**: 5

## What

On `apps/web/src/app/account/page.tsx`, a successful name save calls `refreshUser`. The field and the cabinet heading show the trimmed name.

Refuse empty and whitespace before the request. The message is «Enter your name». A 400 from the route still shows that sentence, not `error` from the JSON when that text is English.

The name field and the preferences field no longer share one lock if that lock is what blocks the heading from updating. Section locking itself is T-4727. This slice only has to refresh the name.

## Why

The route already stores the name. The screen is the piece that keeps the old one.

## Sources

- T-4719a
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/components/auth/AuthProvider.tsx`

## Done

- [ ] After save, the aside heading matches the field
- [ ] Submitting spaces does not call the route and does not clear the stored name
- [ ] A test covers both

## Risks

- [ ] **refreshUser races a second edit.** Apply the response the client just saved. Do not overwrite a newer keystroke with an older response
