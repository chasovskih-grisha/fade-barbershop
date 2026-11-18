# T-4611a · Email Tokens and Font Rule (3/11)

- **Stage**: M2 (phase 7) · **Tags**: design, backend · **Complexity**: junior · **Depends on**: T-4608
- **StoryPoints**: 3
- **Priority**: highest in email lane, immediately after chrome T-4609 and before T-4611b.

## What

Foundation of T-4611: so email primitives (T-4611b) do not have their own "pretty" colors, the source of values must be a token rather than developer memory.

Slice email.* in packages/design-tokens/tokens.json: bg (paper), surface, text.primary / text.secondary, border, accent, radius, spacing — derived from existing light theme (lightTheme.paper = #F4F1EA, lightTheme.ink = #111111), rather than new ideal colors. Each value passes contrast.mjs (already in package) at ≥ 4.5:1 for text and ≥ 3:1 for borders; check is in CI, along with build.mjs.

Font Rule (fixed in design-system.md §Typography and packages/design-tokens/README.md): Fixel Display / Fixel Text are not used in emails — webfont is stripped in Gmail and unsupported in Outlook. Email = system stack, fixed by token email.fontStack, rather than a string in each template. Plus size restriction: body ≥ 14px (fontSize.body), captions ≥ 12 (fontSize.caption).

## Why

In template T-4608 colors are hardcoded manually: color:#666 and color:#111 (booking-confirmation-template.ts:68,69). #111 coincidentally matches ink, while #666 is not a token at all; the next template will simply copy these two values along with the font. Without tokens, "email design system" is just a phrase in README.

## Sources

- packages/design-tokens/tokens.json (lightTheme.paper/ink, text.*, border.*, fontSize.*, radius.*, spacing.*), contrast.mjs, build.mjs, README.md
- design-system.md §Colors (light theme for email/printouts), §Typography (Fixel and webfont limits)
- T-4608 (current template with hardcoding), T-4506 (tokens as shared source)

## Done

- [ ] email.* in tokens.json: bg, surface, text.primary, text.secondary, border, accent, radius, spacing, fontStack
- [ ] Each value derived from lightTheme.*/ text.*/ spacing.*; no new "arbitrary" colors
- [ ] contrast.mjs checks email.*: text ≥ 4.5:1, borders ≥ 3:1; check in CI, non-zero exit on failure
- [ ] email.fontStack — single system stack; regression test / lint: Fixel does not appear in email templates
- [ ] Rule fixed in design-system.md §Typography + packages/design-tokens/README.md
- [ ] pnpm docs:validate green; build.mjs iterates over new slice

## Risks

- [ ] **New colors instead of derived** — a second brand blue will appear in emails; origin check
- [ ] **Contrast "by eye"** — cured only by automated CI check, not review
- [ ] **System stack "just instead of Fixel"** — must be fixed as a rule with a reason, otherwise every subsequent email will argue again
- [ ] **fontSize in pt vs px** — Outlook behaves differently; fix in README
