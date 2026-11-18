# T-4614a · Production images for api, web and admin

- **Stage**: horizontal · **Tags**: devops, infra · **Complexity**: middle · **Depends on**: T-4614, ADR 0018
- **StoryPoints**: 5

## Blocker

Production image: none. Compose on the GMHost VPS (ADR 0051) will run whatever the image starts, which today is the dev server.

- `infra/api.Dockerfile`, `infra/web.Dockerfile`, `infra/admin.Dockerfile` — single dev recipe: `pnpm install`, no `CMD`, no `next build` / `nest build`.
- Comment in file: "Dev image… per-service dev command is supplied by compose".
- `infra/docker-compose.yml`: services `api`, `web`, `admin` start `pnpm --filter @fade/api dev` (and similarly web/admin). Listen on dev ports `13000–13002`.

## What

Separate production images for api, web, admin. Dev recipe and `pnpm dev` remain for local compose (ADR 0018). Production start does not mount host sources and does not run watch.

## Done

- [ ] Production api image runs built process, not `pnpm dev`
- [ ] Production web and admin images serve Next.js production build
- [ ] Local `docker compose --profile apps` continues to start dev
- [ ] Image builds from clean checkout without source volumes

## Risks

- [ ] **Single Dockerfile for two modes**: production target must be an explicit stage or separate file, otherwise Compose on the VPS will take the dev recipe
