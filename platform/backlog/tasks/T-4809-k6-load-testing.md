# T-4809 · Automated Availability Engine Benchmark & k6 Load Testing Suite

- **Stage**: M3 · **Tags**: testing, performance, reliability, backend · **Complexity**: senior · **Depends on**: T-040, T-4802
- **StoryPoints**: 8

## What

Develop an automated load testing suite using Grafana k6 to simulate peak traffic scenarios (e.g. Friday evening rush with 1,000 concurrent users searching and booking slots simultaneously).

- Create k6 load test scripts simulating realistic user journeys: browsing availability, locking a slot, and completing booking checkout.
- Establish performance baselines and latency thresholds (p95 < 200ms for slot queries, p99 < 500ms for booking commits).
- Integrate k6 benchmark execution into staging release pipelines.

## Why

Verify that the availability scheduling engine and database locking mechanisms can withstand heavy traffic surges without latency degradation or race conditions.

## Sources

- `platform/docs/slo.md`, `platform/docs/engineering-principles.md`
- `platform/scripts/benchmark-scheduling.ts`

## Done

- [ ] k6 load test scenario scripts authored for availability lookup and booking checkout flows
- [ ] Automated execution pipeline running load tests against staging environment
- [ ] SLO threshold alerts configured for p95/p99 latency breaches
- [ ] Performance benchmark report generated and archived on each release candidate

## Risks

- [ ] **Test environment capacity**: Ensuring staging database resources mirror production sizing during benchmark runs.
