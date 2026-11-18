# T-2500c · SOLID Refactor (8/40)

- **Stage**: M6 (phase 40) · **Tags**: backend, architecture, solid · **Complexity**: senior · **Depends on**: T-004, T-012, T-021
- **StoryPoints**: 8

## What
Застосувати SOLID принципи: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Переробити класи на інтерфейси, Add інверію залежностей, усунути прямі dependencies від конкретних реалізацій.

## Why
SOLID забезпечує гнучку, підтримувану архітектуру. Інтерфейси замість конкретних класів. Інверія залежностей для тестування.

## Sources
- docs/solid-principles.md — фантом 2026-09-22: файл ніколи не існував; джерело приймається на старті задачі
- `docs/engineering-principles.md`
- Тестові дані з T-2104a

## Done
- [ ] Інтерфейси створені
- [ ] dependencies інвертовані
- [ ] Принципи застосовані