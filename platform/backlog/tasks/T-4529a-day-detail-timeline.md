# T-4529a · Day timeline (4/8)

- **Stage**: M3 (phase 14) · **Tags**: frontend, design · **Complexity**: middle · **Depends on**: T-045, T-4414, T-4420
- **StoryPoints**: 4

## What
Page `/admin/day/{yyyy-mm-dd}`: visit timeline by barbers (real slots: total durations/buffer from T-4520b/T-4522 if active), location filter, previous/next day ribbon. Display special dates (T-4414: closed/shortened) and time-blocks (T-4420) without slots. Visit cards (§5.2) with navigation to full details and to T-4524 (reschedule/bulk).

## Why
Operational basis of the day: the owner sees the schedule by barbers, including closures/blocks. Extracted separately — this is purely reading the existing calendar; statistics are added separately (T-4529b).

## Sources
- `docs/admin-screens.md` §5 (calendar §5.1, card §5.2)
- `backlog/tasks/T-4414` (special dates), `T-4420` (time-block), `T-4522` (slot policies)

## Done
- [ ] Timeline by barbers with location filter; previous/next day
- [ ] Special dates/time-blocks visible without slots
- [ ] Visit cards with transitions; e2e; `pnpm docs:validate` green
