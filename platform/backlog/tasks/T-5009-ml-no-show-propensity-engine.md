---
id: T-5009
title: "Machine Learning No-Show Propensity & Dynamic Deposit Enforcement"
status: todo
sp: 13
priority: high
category: ml, analytics, booking, risk
phase: 50
milestone: M10
source: "docs/booking-engine-optimization-report.md, crm README, pricing"
adr: [0011, 0022]
screens: ["admin-screens.md", "web-screens.md"]
---

# T-5009: Machine Learning No-Show Propensity & Dynamic Deposit Enforcement

## Overview

No-shows and late cancellations directly disrupt chair utilization and barber compensation. While static cancellation policies (`T-160`) apply blanket rules, they either penalize loyal clients unnecessarily or fail to deter high-risk bookings.

This task builds a machine learning inference pipeline that scores every incoming booking request for no-show probability based on client history, booking lead time, time of day, historical cancellation rates, and contact verification status, automatically triggering dynamic deposit requirements (`T-091`) or overbooking buffers.

## Scope

- **Feature Engineering Pipeline**: Extracting client lifetime behavior, visit frequency, cancellation history, device fingerprint, and booking velocity features into PostgreSQL/Redis.
- **LightGBM No-Show Scoring Model**: Training and serving a lightweight binary classification model scoring each appointment from 0.0 to 1.0.
- **Dynamic Policy Enforcement**: Automatic rules engine adjusting deposit requirements (0%, 50%, 100%) or requiring instant Apple/Google Pay verification based on risk score thresholds.
- **Model Monitoring & Drift Detection**: Tracking AUC-ROC, precision/recall, and feature drift over time in Prometheus.

## Acceptance Criteria

1. Scoring inference executes in <50ms during the booking flow checkout step without impacting page load latency.
2. Model achieves an AUC-ROC >= 0.82 on historical appointment test sets.
3. Reduces overall network no-show rate by at least 35% within 30 days of rollout without decreasing legitimate booking conversion.
