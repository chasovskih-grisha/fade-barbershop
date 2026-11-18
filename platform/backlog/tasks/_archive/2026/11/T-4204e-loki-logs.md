# T-4204e · Loki + Promtail — Centralized API logs (Slice T-4204)

- **Stage**: M5 (phase 30) · **Tags**: infra, devops · **Complexity**: middle · **Depends on**: T-4204d (Grafana)
- **StoryPoints**: 5

## What
Services `loki` (single-binary, filesystem, port 19095) and `promtail` in `obs` profile. The api container writes the same daily JSON files (`DailyFileLogger`, observability.md §2 contract) to the shared volume `api_logs`; promtail tails `/var/log/fade/*/*/*/api.log`, pipeline: timestamp from `ts`, label `level`, push to Loki. Grafana: Loki datasource (uid `loki-fade`) + logs panel on "Fade — Overview" (`{app="api", job="fade-api"} | json | ...`).

## Why
The log contract §2 ("do not change without T-4204") got a consumer: JSON lines are searchable (level — label, ctx/src/msg — via `| json`), without changing the logger. Volume — zero changes in the application.

## Sources
- docs/observability.md §1–2 (log contract)
- Google SRE Book (structured logging)

## Criteria
- [x] Loki ready; promtail target `fade-api` added
- [x] Real api lines in Loki with correct labels (level: INFO from pipeline)
- [x] Grafana Loki-datasource health OK; logs panel on dashboard
- [x] Note: api container required recreate for new volume (compose does not add volume to a running container)
- [x] Re-verification 2026-09-29: chain live end-to-end — HTTP → log §2 → volume `api_logs/2026/09/29/api.log` → promtail → Loki → LogQL (`{app="api", job="fade-api"} | json | ctx="OtpSender"`) in ~4s; last Loki line = last file line (freshness), and it carries `traceId` shared with Tempo trace (cross-proof log↔trace via promtail `derived_fields`)
