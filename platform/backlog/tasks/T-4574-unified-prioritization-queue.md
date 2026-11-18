# T-4574 · Unified Prioritization Queue: Waitlist, Weak-Hours, Founder Alerts, Calendar Bulk (P1)

- **Stage**: M4 (phase 16-18) · **Tags**: backend, scheduling, analytics, crm · **Complexity**: senior · **Depends on**: T-4453, T-4464, T-4505, T-4524, T-4545, T-4556
- **StoryPoints**: 13

## What

Unified priority action queue for operators (P1 from Canvas) — combines:
- **Waitlist priority** (T-4453): who gets the next available slot
- **Weak-hours suggestions** (T-4464): low occupancy slots → recommended actions (promo, schedule shift, reminder)
- **Founder critical alerts** (T-4505): API down, 0 payments, 5xx spikes → escalation
- **Calendar bulk actions** (T-4524): bulk rescheduling/cancellation during force majeure (barber sick)
- **High-risk client actions** (T-4560): clients with no-show restrictions → slot offer with deposit requirement

**Unified Queue Item**: type (WAITLIST_OFFER / WEAK_HOUR_ACTION / ALERT / BULK_RESCHEDULE / HIGH_RISK_SLOT), priority (1-10), context (entityIds, reason, suggestedAction), status (PENDING/ACKNOWLEDGED/EXECUTED/DISMISSED), assignedOperatorId, createdAt, acknowledgedAt

**Operator UI**: Unified "Priority Actions" inbox in admin (real-time, WebSocket), filters by type, bulk acknowledge, execute action → redirection to the corresponding screen with prefilled context

## Why

Operators no longer switch between screens — a single priority action inbox. Canvas: "Join waitlist priority, weak-hour suggestions, founder alerts, and bulk calendar actions without making backlog status the runtime model."

## Sources

- T-4453 (waitlist priorities), T-4464 (slow hours), T-4505 (founder alerts), T-4524 (calendar bulk), T-4545 (segmentation), T-4556 (rules), T-4560 (no-show management)
- Canvas P1: "Unified prioritization queue"

## Done

- [ ] Domain: `PriorityQueueItem` (type, priority, context, status, operatorId), `PriorityQueueRule` (trigger, condition, action, priority)
- [ ] Engine: event-driven — domain events → evaluate rules → create queue items
- [ ] Rules: waitlist slot freed → WAITLIST_OFFER (priority by T-4453), utilization < 30% → WEAK_HOUR_ACTION (priority by revenue impact), API down → ALERT (priority 10), barber sick → BULK_RESCHEDULE (priority 8)
- [ ] Operator UI: Inbox component (WebSocket updates), keyboard shortcuts (J/K navigation, Enter — execute, D — dismiss)
- [ ] Action executors: for each type — deep link to the corresponding screen with context
- [ ] Analytics: queue throughput, avg time to acknowledge, action distribution, operator performance

## Risks

- [ ] **Alert fatigue**: alert deduplication (T-4505 dedup), aggregation of similar items
- [ ] **Priority inversion**: low-priority items clogging the queue — aging mechanism (increasing priority over time)
