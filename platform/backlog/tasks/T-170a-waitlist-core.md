# T-170a · Waitlist Core (4/10)

- **Stage**: M4 (phase 17) · **Tags**: backend, high-risk · **Complexity**: middle · **Depends on**: T-042
- **StoryPoints**: 4

## What
Implement base queue: FIFO, soft-hold, offer cascade. Support statuses and events. Interface for admin panel.

## Why
Core waitlist logic before frontend and automation. Subscribers: loyalty, reviews, analytics.

## Sources
- WTL-001…008 (specification)
- ADR 0012 (waitlist)

## Done
- [ ] FIFO queue works
- [ ] Soft-hold and cascade implemented
- [ ] Events and statuses

## Dependencies
- T-171 (waitlist surfaces — client and admin; separate indexed task, not parent slices)
