# T-4215 · Tax Engine

- **Stage**: M6 (phase 40) · **Tags**: backend, finance, legal, high-risk · **Complexity**: senior · **Depends on**: T-090, T-4001
- **StoryPoints**: 20

## What
Tax engine: **Jurisdictions** — Ukraine (VAT 20%, FOP single tax 5%/3%), EU (VAT OSS/IOSS), USA (sales tax by nexus), Canada (GST/HST/PST); **Rules** — product/service classification, exemptions (medical services, education), reverse charge (B2B cross-border), place of supply rules; **Calculation** — by order line item, inclusive/exclusive, rounding rules (banker's rounding), multi-currency; **Reporting** — VAT return, single tax report, EU OSS return, US sales tax filing (Avalara/TaxJar integration); **Compliance** — invoice requirements (number, date, VAT, EDRPOU), e-invoicing (Peppol/Diia), 7-year archive.

## Why
Multi-region = complex taxes. Automation = compliance. Errors = penalties.

## Sources
- docs/tax-engine.md — phantom 2026-09-22: file never existed; source is accepted at task start
- Tax Code of Ukraine / EU VAT Directive / US Wayfair
- Avalara / TaxJar / Vertex

## dependencies
> Slices are defined upon task start; separate subtask files are created then if needed.

## Done

- [ ] Multi-jurisdiction calculation (UA, EU, US)
- [ ] Rounding and inclusive/exclusive rules
- [ ] Invoice compliance and EDRPOU / VAT verification
- [ ] Integration tests with tax mock / Avalara stub

## Risks

- [ ] **Tax law changes**: tax rates and rules change frequently — keep tax logic isolated and declarative
