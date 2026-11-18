# T-4572 · Data import/export: CSV/Excel, validation, deduplication, error reporting

- **Stage**: M4 (phase 16+) · **Tags**: backend, data, ops · **Complexity**: middle · **Depends on**: T-4448, T-4544, T-4561, T-4563, T-4565
- **StoryPoints**: 8

## What

Data import/export for operational management (extending T-4448):
- **Import**: Clients, Services, Products, Barbers (schedule), Appointments (historical), Gift Cards, Memberships
- **Formats**: CSV (UTF-8, delimiter auto-detect), Excel (.xlsx) — optional
- **Validation**: schema per entity type (required fields, types, enums, FK existence, business rules), row-level errors with description
- **Deduplication**: for clients — fuzzy match by phone/email/name (T-4423), for services — by slug/name, for products — by SKU/barcode
- **Import modes**: INSERT_ONLY, UPSERT (update existing), REPLACE (delete + insert — dangerous, requires confirmation)
- **Error reporting**: report with errors by row, download CSV with errors, partial success (commit valid rows, skip invalid)
- **Export**: all entities + analytics reports (T-4563), filtered by current view, CSV/Excel, streaming for large datasets
- **Scheduled exports**: automatic report export to email/S3 (daily/weekly)
- **Audit**: import/export is logged in T-4565 (actor, entity, count, file hash)

## Why

Data migration, bulk updates, integration with external systems, backup, sending to the accountant.

## Sources

- T-4448 (export/backup), T-4544 (CRM import/export), T-4561 (inventory import), T-4563 (analytics export), T-4565 (audit)
- Altegio: import/eksport CSV/Excel, walidacja, deduplikacja, raporty błędów

## Done

- [ ] Import pipeline: `ImportJob` (entity, mode, fileRef, status, stats, errors[]), chunked processing (1000 rows/batch), transaction per batch
- [ ] Validators: Zod schemas for each entity, custom rules (unique phone, valid barberId, etc.)
- [ ] Dedupe engine: blocking keys (phone, email, slug), candidate generation, scoring, auto-merge below threshold, review queue above
- [ ] Export pipeline: `ExportJob` (entity, filters, format, status, fileRef), cursor-based streaming, zip for large files
- [ ] Admin UI: Import Wizard (steps: file → mapping → validation → confirm → progress → report), Export Builder
- [ ] Templates: download CSV templates with headers and examples for each entity

## Risks

- [ ] **Large files**: > 100k rows — chunked upload (Tus.io) or S3 presigned URL, background processing
- [ ] **Data integrity**: UPSERT can overwrite valid data — dry-run mode, preview changes
