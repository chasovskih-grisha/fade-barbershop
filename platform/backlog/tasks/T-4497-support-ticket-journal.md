# T-4497 · Support Ticket Journal

- **Stage**: M6 (phase 40) · **Tags**: backend, crm, admin · **Complexity**: junior · **Depends on**: T-060, T-4461
- **StoryPoints**: 5

## What

"Support" section in CRM: ticket creation (client, topic, channel — phone/chat/push), assignment, statuses (new/in progress/resolved), SLA markers, client editing / appointment as a consequence of the ticket, history. Uses filters (T-4461) and card (T-4425).

## Why

Tickets during CLT-01 (questions, booking confusion, complaints) are currently scattered; journal with SLA is the baseline for response and ensuring "nothing is lost".

## Sources

- crm README; admin-screens.md §14 (support); T-060, T-4425

## Done

- [ ] CRUD of tickets with statuses/SLA in CRM; operator assignment
- [ ] Consequences (appointment/client changes) are logged to ticket history
- [ ] "SLA overdue" list (filter, T-4461)

## Risks

- [ ] **Channel duplication**: chat ticket topic vs phone — deduplication by client (T-4494 contact)
