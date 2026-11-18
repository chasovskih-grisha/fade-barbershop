# T-4424 · Manual customer tags / segments

- **Stage**: M2 (phase 5) · **Tags**: backend, crm · **Complexity**: junior · **Depends on**: T-060, T-046
- **StoryPoints**: 3

## What

Tags (`CustomerTag`) on client card: free-form color tags (demo examples: VIP, beard growth champion, brought relatives), CRM list filtering by tags, saved filter combinations (T-4461). Initial segmentation without complex rules (i.e. leaving T-3000 + constructs out).

## Why

Operators understand how to "attach" clients without analytics; manual tags are the fastest local way to react to workflows (noted a weak minimum → tag, call personally).

## Sources

- crm README; admin-screens.md §6 (client card); T-3000 (segmentation — light, this task is simpler)

## Done

- [ ] Tag CRUD on card, list filtering by tags
- [ ] Tags survive merge (T-4423) — test
- [ ] Demo tags in CLT-01 seeds

## Risks

- [ ] **Tag chaos**: preset palette + LOCATION_MANAGER admin permissions do not create arbitrary tags
