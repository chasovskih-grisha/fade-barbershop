# T-270b · Shop Dockerfile

- **Stage**: M5 (phase 27) · **Tags**: devops, docker, shop · **Complexity**: junior · **Depends on**: T-270a
- **StoryPoints**: 3

## What
Docker containerization for the online shop application (Next.js app build → production):
- Base image from Node.js Alpine
- Install dependencies (pnpm)
- Build Next.js app
- Production image with nginx/caddy
- Environment variable configuration
- Add to docker-compose.yml

## Sources

- T-270a (app structure)
- docker-compose.yml pattern
- infra/*.Dockerfile

## Done

- [ ] Dockerfile created
- [ ] Multi-stage build works
- [ ] Production image works
- [ ] Env vars configured
- [ ] Added to docker-compose.yml
- [ ] Build succeeds
- [ ] Container runs

## Risks

- [ ] **Image size**: production image may be too large
