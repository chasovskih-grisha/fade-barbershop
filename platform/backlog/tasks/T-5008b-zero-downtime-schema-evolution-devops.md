---
id: T-5008b
title: "Zero-Downtime Database Schema Evolution: DevOps CI Linter & Deployment"
status: todo
sp: 4
priority: high
category: devops
phase: 50
milestone: M10
source: "T-5008 slice (devops)"
adr: [0005, 0014]
screens: ["admin-screens.md"]
---

# T-5008b · Zero-Downtime Database Schema Evolution: DevOps CI Linter & Deployment

- **Stage**: M10 · **Tags**: devops · **Complexity**: senior · **Depends on**: T-5008
- **StoryPoints**: 4

## What

Automated CI migration linter using pg-meta / sqlfluff to reject unsafe DDL statements (e.g. adding NOT NULL columns without default, exclusive table locks) during pull requests, plus deployment verification scripts.

## Done

- [ ] CI migration linter workflow blocks PRs with unsafe DDL statements on production tables
- [ ] Automated pre-migration and post-migration verification scripts integrated into deployment pipeline
- [ ] Documentation and CI checks verified against sample migrations
