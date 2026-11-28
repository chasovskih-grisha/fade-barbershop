# T-4521d · Категорія послуги в матриці без `undefined`

- **Stage**: M1 · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-4521b

## What

Хвіст T-4521b: `locationServices()` клала `category: service.category` (тобто `string | undefined`)
у `MatrixService` із `category?: string`, а адмін-застосунок компілюється з
`exactOptionalPropertyTypes: true`. `tsc` для `@fade/admin` падав на
`barber-matrix-data.ts(39)` — тобто категорний режим матриці не компілювався.

## Done

- [x] Каталог → рядок матриці йде через `toMatrixService()`: поле `category` додається, лише коли API його дав.
- [x] Регресійний тест на обидві гілки (з категорією і без) + групування «Без категорії».

## Implementation plan

Paths:
- apps/admin/src/app/barbers/barber-matrix-data.ts
- apps/admin/src/app/barbers/barber-matrix-data.test.ts

Checks:
- pnpm --filter @fade/admin exec jest --runTestsByPath $PWD/apps/admin/src/app/barbers/barber-matrix-data.test.ts

## Implementation notes

- apps/admin/src/app/barbers/barber-matrix-data.test.ts
- apps/admin/src/app/barbers/barber-matrix-data.ts

## QA

- `pnpm --filter @fade/admin exec jest --runTestsByPath $PWD/apps/admin/src/app/barbers/barber-matrix-data.test.ts` exit 0
