# T-4484 · Client and Loyalty Portability Across Locations

- **Stage**: M6 (phase 40) · **Tags**: backend, crm, loyalty · **Complexity**: middle · **Depends on**: T-105, T-140
- **StoryPoints**: 5

## What

Multiple locations (network, T-105): a client can be linked to multiple locations; visit history and loyalty points (T-140) are transferred/aggregated upon relocation, aggregates are visible across locations. Single city account profile, point maintenance is not permanently tied to a physical location.

## Why

Network = client comes to any branch; currently data is fixed to the check-in location and points permanently "live" there.

## Sources

- crm README; loyalty README; T-105 (location network), T-140 (loyalty)

## Done

- [ ] Client linked to multi-locations; points are readable from any location
- [ ] Transfer/aggregation occurs via events (T-4404 log records)
- [ ] Test: 2 locations, single point balance with visits in both

## Risks

- [ ] **Double crediting**: visit at location B after moving from A does not duplicate points (idempotent key)
