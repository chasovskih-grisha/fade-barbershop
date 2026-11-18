# T-301 · Автоматизація GWT-сценаріїв флоу запису

- **Stage**: горизонтальна (старт з M1) · **Tags**: integration · **Complexity**: middle · **Depends on**: T-041 (перший прохід вручну)
- **StoryPoints**: 5

## What

Автоматизувати 8 сценаріїв `booking-flow-tests.md` (e2e: web-флоу + гілки — party, AI inline, промокод з капом, waitlist, помилки оплати) + регрес ключових AC-гейтів (PAY, LYL, DSC). Mobile-гілки — на тих самих сценаріях (окремий розділ booking-flow.md).

## Sources

- `booking-flow-tests.md` (сценарії і правило приймання); traceability (гейти)
- `docs/engineering-principles.md` (піраміда тестів, ковередж-гейти CI, правила якості тестів)

## Done

- [ ] Сценарії в CI; червоний білд при порушенні AC
- [ ] Піраміда дотримана за `engineering-principles.md`: e2e ≤ 10%, ковередж не нижче гейтів (api ≥ 85% рядків), фейкові ACL-порти замість моків

## Risks

- [ ] **E2E крихкість**: селектори за data-testid, не по стилях

