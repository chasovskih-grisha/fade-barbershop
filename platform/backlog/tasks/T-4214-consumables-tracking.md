# T-4214 · Consumables accounting

- **Stage**: M6 (phase 40) · **Tags**: backend, retail, operations · **Complexity**: middle · **Dependencies**: T-270, T-3401
- **StoryPoints**: 15

## What
Consumables by services: **Recipe** — color (tubes/grams), oxidant (ml), brow dye, disposable gloves, aprons, disinfectant, foil, cotton; **Write-off** — automatic on visit completion (AppointmentCompleted → write-off recipe), manual adjustment (barber specified actual consumption), loss tracking (expired/spoiled); **Cost** — service cost (materials + time), margin by service/barber/location; **Notifications** — low stock on consumables, auto-reorder (T-3400); **Reporting** — consumption by location/barber/service, trends, budgeting.

## Why
Accurate cost = correct pricing. Consumption control = margin. Auto-write-off = less manual work.

## Requirement sources
- docs/consumables.md — phantom 2026-09-22: file never existed; source accepted at task start
- `shop.md` §Consumables
- `inventory-control.md` §By services

## Dependencies
> Slices allocated at task start; separate subtask files created then if needed.
