# T-4840a · Slice: share the studio on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4840
- **StoryPoints**: 3

## What

A control in the studio action row copies the page URL. Where the browser offers a share sheet, the control uses it with the studio name and that URL. After a copy, the control says the link was copied, then returns to its label.

## Why

Desktop browsers often have no share sheet. The copy has to be the reliable path.

## Sources

- T-4840
- `apps/web/src/app/locations/[code]/LocationDetail.tsx`

## Done

- [ ] The copied text is the absolute URL of `/locations/{code}`
- [ ] The confirmation is text, not only a color change
- [ ] A test covers the copy path

## Risks

- [ ] **Clipboard permission denied.** The control reports that the copy failed and leaves the URL visible in the address bar. It does not show a fake success

## Out of scope

- The app share sheet (T-4840b)
