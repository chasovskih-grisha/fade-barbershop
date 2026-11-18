# T-053u · Offline mode fade.com.ua/booking

- **Stage**: M5 (phase 25) · **Tags**: frontend, pwa · **Complexity**: middle · **Depends on**: T-053k (PWA), T-4429
- **StoryPoints**: 5

## What

Offline mode for quick-booking:
- Service Worker caching of flow steps
- Offline queue for pending appointments
- Background sync upon connection restoration
- Offline indicator
- Optimistic UI updates
- Conflict resolution for competing appointments

## Sources

- T-4429 (offline cache pattern)
- T-053k (PWA)
- PWA best practices

## Done

- [ ] Service Worker caches steps
- [ ] Offline queue works
- [ ] Background sync works
- [ ] Offline indicator present
- [ ] Conflict resolution works
- [ ] Lighthouse offline score > 90

## Risks

- [ ] **Data consistency**: offline conflicts may cause issues
