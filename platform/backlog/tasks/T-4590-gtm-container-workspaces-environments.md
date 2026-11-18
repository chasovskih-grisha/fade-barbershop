# T-4590 · GTM Container, Workspace, Environments and Versioning

- **Stage**: M2 (before phase 3 — website) · **Tags**: analytics, devops, integration · **Complexity**: middle · **Depends on**: T-030
- **StoryPoints**: 5

## What

Creation of Google Tag Manager Web Container and its change infrastructure: workspace, Staging/Live environments, versions, export to repository.

### Container
- One Web Container `Fade Web (fade.com.ua)` on public host `fade.com.ua`, including `/booking` route (T-053). No separate booking host (ADR 0017, revision 2026-10-01). A separate container will appear when `shop.fade.com.ua` or another public host appears. `admin.fade.com.ua` is not included in this container.
- One GA4 measurement ID per container, separate **IDs per environment** (see below) — one GA4 dataset, one GTM container.

### Workspace and Environments
- GTM Workspace: changes → Workspace → Review → publishing. Workspace is mandatory: without it, live container pushes would be done via manual publication without a diff.
- Environments: `Staging` (host `staging.fade.com.ua`, separate `G-` ID) and `Live` (`fade.com.ua`, working `G-` ID). Version promotion: Staging → Live, as a separate step, with diff in PR.
- Each environment = separate GTM version containing its own measurement ID value via Variable with a default value (not via two duplicated sets of tags).

### Versioning in Repository
- JSON export: `development/platform/infra/analytics/gtm/container.json` (workspace) + `development/platform/infra/analytics/gtm/environments.json` (environments) — committed along with any tag changes.
- Container importability remains **manual** (owner is the founder, like in the rest of the infrastructure) — CI does not have Google access, and automatic import would overwrite production without review.
- `development/platform/infra/analytics/gtm/README.md`: container ownership, how to export, how to import, how to roll back a version.

### Environment Variables (public — not secrets)
- `NEXT_PUBLIC_GTM_ID` (e.g. `GTM-XXXXXXX`)
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (`G-XXXXXXX`, staging and live are different)
- `GA4_API_SECRET` — **server-only**, never `NEXT_PUBLIC_`, only for Measurement Protocol (T-4597)

## Why

Without versioning, changing tags is a manual operation in a third-party UI without diff, without review, and without a rollback capability. For a solo founder, GTM is the single easiest place to break sales ("broken" GA4 Config tag = zero analytics with a fully live site), so the container behaves like code: export to repository, review in PR, promotion via environments.

## Sources

- `products.md` §1 — website analytics
- `roadmap.md` — analytics as a hard v1 gate
- T-4403 (legacy web analytics) — GTM/GA4 remained unimplemented
- T-053 — quick-booking on `fade.com.ua/booking`, the same application

## Done

- [ ] Created Web Container `Fade Web (fade.com.ua)` with description (Tracking Tag Manager / Consent Mode sections)
- [ ] Enabled Workspace; first workspace commit is a base version without GA4 tags
- [ ] Created `Staging` and `Live` environments, both with their own `G-` ID; version promotion tested end-to-end (staging hosts → live hosts)
- [ ] `container.json` + `environments.json` exported to `infra/analytics/gtm/` and committed
- [ ] `infra/analytics/gtm/README.md`: owner, export/import procedure, version rollback procedure
- [ ] Host `fade.com.ua` (showcase and `/booking`) checked for GTM script; `admin.fade.com.ua` is consciously **not** in scope
- [ ] Container limits (number of tags/variables/triggers) cross-checked with GTM admin **before** importing next tags — headroom exists

## Risks

- [ ] **Data in third-party UI**: container without an owner and without export means irreversible configuration loss; therefore README is mandatory, not "later"
- [ ] **`admin.fade.com.ua`**: if added to the same data stream, internal traffic will hit GA4 — exclusion at the data stream level, not just GTM trigger (T-4601)
- [ ] **Single container for showcase and `/booking`**: error in environment breaks the entire public site; mitigation — staging environment with a separate ID
- [ ] **GA4 quota**: events > 10M/month (agent view) not expected, but free limit of 500 different events per property does not apply (we have ~24)
