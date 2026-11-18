# FADE — Reputation & Competitive Intelligence Specialist Report

As the autonomous **Reputation and Competitive Intelligence Specialist** for FADE (`Projects/barbershop/platform`), this run delivers advanced sentiment tracking, automated escalation workflows, keyword sentiment clustering, platform source attribution, and local competitive benchmarking for the Kyiv district and multi-branch operations.

---

## Architecture & Implementation Overview

### 1. Reputation Engine (`@fade/domain-shared`)
Located in `packages/domain-shared/src/reputation/engine.ts`, the core engine provides:
- **Summary Metrics (`calculateSummary`)**: Computes average ratings, review volume, sentiment breakdown percentages (positive, neutral, negative), response rates, and market delta comparison against local competitors.
- **Sentiment Classification (`classifySentiment`)**: Combines rating thresholds with keyword NLP analysis (`bad`, `poor`, `disappointed`, `great`, `masterclass`, etc.) to classify reviews accurately.
- **Automated AI Reply & Escalation (`generateAutoReply`)**: Generates personalized professional responses based on client name, service, and sentiment, flagging negative reviews (`rating <= 2`) for urgent management escalation.
- **Competitor Review Velocity (`analyzeCompetitorVelocity`)**: Evaluates monthly review growth velocity, market share of voice, competitive ranking, and threat levels.
- **Review Topic Sentiment Clustering (`analyzeReviewTopics`)**: Breaks down feedback across key operational pillars: *Haircut Precision*, *Punctuality & Wait Time*, *Shop Vibe & Cleanliness*, *Staff Courtesy*, and *Beard & Grooming*.
- **Competitor Action Plan (`generateCompetitorActionPlan`)**: Generates strategic action items and priority levels based on market rating gaps and unreplied negative reviews.
- **Sentiment Alert Evaluation (`evaluateSentimentAlerts`)**: Monitors real-time alert rules for low ratings or negative sentiment spikes.
- **Competitor Pricing Matrix (`analyzeCompetitorPricingMatrix`)**: Benchmarks FADE pricing against local competitors to identify positioning categories (e.g., *Premium Value Leader*, *Mid-Market*, *Value Challenger*).
- **Sentiment Trend Forecasting (`forecastSentimentTrend`)**: Projects next-month ratings, trajectory (`improving`, `stable`, `declining`), review momentum index, and brand loyalty scores.
- **Platform Source Attribution Analysis (`analyzePlatformAttribution`)**: Evaluates review distribution across Google, Yelp, App Feedback, Facebook, and Instagram, computing source diversification scores and platform-specific response rates.

### 2. Admin Reputation Dashboard (`apps/admin`)
Located in `apps/admin/src/app/reputation/page.tsx`, the dashboard surfaces:
- Real-time rating summaries and positive sentiment KPIs.
- Interactive **Competitor Velocity & Market Share** deep-dive panel.
- Topic sentiment breakdown cards.
- AI Auto-Reply generator and management escalation triggers.
- Multi-platform source attribution analytics.

---

## Verification & Testing
All domain-shared unit tests (`packages/domain-shared/src/reputation/__tests__/engine.test.ts`) pass successfully:
- Summary calculation and market comparisons.
- Sentiment classification rules.
- Auto-reply and escalation triggers.
- Competitor velocity and pricing matrix analysis.
- Sentiment trend forecasting and platform attribution.
