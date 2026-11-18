# T-3903 · Walk-in Lobby Kiosk

- **Stage**: M4 (phase 22) · **Tags**: frontend, hardware, ux · **Complexity**: middle · **Depends on**: T-090, T-140, T-053
- **StoryPoints**: 15

## What
Lobby kiosk screen for walk-in: QR-join to live queue, estimated time arrival (ETA) display, self-service service selection, admin queue management from admin panel, synchronization with waitlist (FIFO, soft-hold).

## Why
Walk-in is a separate channel (AC 09). Kiosk unloads the barber: the client joins the queue themselves and sees ETA, while admin manages the flow from a tablet.

## Sources
- docs/walkin-kiosk.md — phantom 2026-09-22: file never existed; source accepted at task start
- AC 09 (walk-in), AC 14 (waitlist)

## dependencies

> Slices are allocated at task start; individual subtask files are created then as needed.
## Checklist
- [ ] QR-join queue (no login, phone = identifier)
- [ ] ETA display (calculated from chair occupancy)
- [ ] Self-service service selection (limit — launch-SKU)
- [ ] Admin queue management from admin panel
- [ ] Waitlist synchronization (FIFO, soft-hold 15 min)
