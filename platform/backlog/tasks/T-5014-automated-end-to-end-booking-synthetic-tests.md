---
id: T-5014
title: "Automated End-to-End Synthetic Booking & Payment Canary Testing"
status: todo
sp: 8
priority: high
category: testing, qa, observability, reliability
phase: 50
milestone: M10
source: "docs/testing-guidelines.md, observability.md, architecture.md"
adr: [0007, 0020]
screens: ["admin-screens.md"]
---

# T-5014: Automated End-to-End Synthetic Booking & Payment Canary Testing

## Overview

Silent regressions in the critical booking funnels (slot selection -> phone auth -> payment gateway -> appointment confirmation) can cause massive revenue loss before being detected by human staff. 

This task implements an automated Playwright-based synthetic canary test suite running every 15 minutes against production and staging environments, executing real end-to-end bookings with test credit cards, verifying SMS notifications, and alerting engineers immediately if any step fails.

## Scope

- **Playwright Synthetic Canary Runner**: Headless browser automation testing the 5-step booking flow (`T-053c`), phone OTP verification mocking, and Stripe/Apple Pay sandbox checkouts.
- **Continuous Monitoring & Prometheus Metrics**: Exposing synthetic test success/failure gauges and step latency histograms to Prometheus (`T-4204`).
- **PagerDuty & Slack Alerting**: Immediate incident dispatch if synthetic test fails 2 consecutive runs.
- **Sandbox Payment Token Isolation**: Secure credential management and test fixture cleanup ensuring test appointments do not clutter live barbershop capacity.

## Acceptance Criteria

1. Synthetic canary executes successfully every 15 minutes in both staging and production.
2. Alerts dispatch to PagerDuty within 2 minutes of any booking flow regression or payment gateway error.
3. Test suite execution reports integrated into Grafana dashboard with historical availability uptime tracking.
