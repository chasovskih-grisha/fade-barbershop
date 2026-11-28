# T-130 · Живі слоти: OHS-проекція + блоки на сайті

- **Stage**: M3 (phase 23, рекомендовано в v1) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-040, T-030
- **StoryPoints**: 5

## What

`GET /public/availability` (read-only, тільки агрегати, без авторизації, кеш Redis 60 с — LST-004/008); блоки на головній (§0, рішення зафіксоване), `/services` (LST-WEB-01), `/locations/{code}` (LST-WEB-02), `/barbers/{slug}` (LST-WEB-03); деградація — блок ховається (LST-005); порожній стан → waitlist-CTA (гейт фази 17, до неї — «зателефонуйте нам»).

## Sources

- `LST-001…008`, `LST-WEB-01…04`; `web-screens.md` §0/2/3

## Done

- [ ] Проекція не бронює; клік веде у флоу з повторною валідацією
- [ ] Блоки на трьох типах сторінок з усіма станами

## Risks

- [ ] **Кеш 60 с vs реальний стан**: деградація — блок ховається (LST-005)
- [ ] **Навантаження**: публічний ендпоінт без авторизації — rate limit


## Blocking evidence

`GET /public/availability` does not exist: `grep -rln "public/availability" apps/api/src` matches only `apps/api/src/scheduling/README.md`, and there is no Redis cache binding in the API. The web blocks the row asks for (home, `/services`, `/locations/{code}`, `/barbers/{slug}`) would have to invent slots, so the row waits on the availability endpoint.
