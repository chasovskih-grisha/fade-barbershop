# T-4727b · Separate save state on the website profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4727a
- **StoryPoints**: 5

## What

Split the shared `saving` flag and the shared banner on `apps/web/src/app/account/page.tsx` into per-section state. Each card shows its own sentence from slice a. A name request in flight disables only the name button.

## Why

The page is where the one flag lives.

## Sources

- T-4727a
- `apps/web/src/app/account/page.tsx`

## Done

- [ ] Name and preferences can be saved independently
- [ ] Each card shows only its own result

## Risks

- [ ] **Moving the requests.** The existing name and preference routes stay. This slice changes the screen state around them
