# T-6001 · AI-Powered Automated Customer Churn Prediction and Win-Back Campaign Orchestrator

- **Stage**: M4 (phase 18) · **Tags**: ai, backend, marketing, analytics · **Complexity**: senior · **Depends on**: T-180, T-110, T-3101
- **StoryPoints**: 13

## What

Implement an automated machine learning churn prediction engine that analyses visit frequency drop-offs, booking intervals, cancellation rates, and feedback scores. When a client exceeds their personalized visit threshold by 150%, trigger a multi-channel win-back campaign via SMS, push notification, and email with dynamic personalized discounting calibrated via unit economics rules.

## Why

Customer retention is significantly cheaper than acquisition. Automated churn prediction prevents client leakage before customers permanently switch to competing barbershops.

## Acceptance Criteria

1. ML model computes churn propensity score daily for all active clients with >2 past visits.
2. Automated trigger fires win-back sequence precisely when propensity exceeds 0.75 threshold.
3. Admin dashboard displays churn risk cohorts, win-back conversion rates, and revenue saved metrics.
