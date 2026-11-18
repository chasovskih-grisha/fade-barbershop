---
id: T-5008a
title: "Zero-Downtime Database Schema Evolution: Backend Expand-Contract"
status: todo
sp: 4
priority: high
category: backend
phase: 50
milestone: M10
source: "T-5008 slice (backend)"
adr: [0005, 0014]
screens: ["admin-screens.md"]
---

# T-5008a · Zero-Downtime Database Schema Evolution: Backend Expand-Contract

- **Stage**: M10 · **Tags**: backend · **Complexity**: senior · **Depends on**: T-5008
- **StoryPoints**: 4

## What

Expand-Contract migration pattern and TypeScript helpers/decorators for multi-phase schema migrations on heavily written tables (`appointments`, `payments`, `ledger_entries`), online index building (`CREATE INDEX CONCURRENTLY`), and rollback safety verification.

## Done

- [ ] Expand-Contract pattern implemented with TypeScript helpers for dual-write and backfill phases
- [ ] Online index building (`CREATE INDEX CONCURRENTLY`) enforced for all new indexes
- [ ] Unit and integration tests covering migration state transitions and rollback safety
