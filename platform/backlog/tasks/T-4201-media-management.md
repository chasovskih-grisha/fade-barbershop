# T-4201 · File and Media Management

- **Stage**: M5 (phase 30) · **Tags**: backend, integration · **Complexity**: senior · **Depends on**: T-002, T-030, T-190, T-270
- **StoryPoints**: 20

## What
Media platform: upload (multipart/presigned URL), transformation (resize, crop, WebP/AVIF, blur placeholder), CDN (Cloudflare R2 / AWS S3 + CloudFront), virus scanning (ClamAV), permissions (private/public/signed URLs), client/barber avatars, portfolio (before/after), shop product photos, documents (contracts, receipts), versioning, cleanup orphaned files.

## Why
All visual content through a unified pipeline. Optimization = speed. Security = virus check. CDN = global performance.

## Sources
- docs/media-management.md — phantom 2026-09-22: file never existed; source accepted at task start
- Cloudflare Images / imgix / Thumbor pattern

## dependencies
> Slices are separated at task start; individual subtask files are created then if needed.
