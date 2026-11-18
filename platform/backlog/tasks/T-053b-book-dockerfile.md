# T-053b · Dockerfile for the `book` app

- **Stage**: M1 (phase 4) · **Tags**: infra, docker · **Complexity**: junior · **Depends on**: T-053a
- **StoryPoints**: 2

## What

Creating Dockerfile for the book app:
- Multi-stage build (build → production)
- Base image from Node.js Alpine
- Install dependencies (pnpm)
- Build Next.js app
- Production image with nginx/caddy
- Environment variable configuration
- Add to docker-compose.yml

## Sources

- T-053a (app structure)
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

- [ ] **Image size**: production image might be too large
