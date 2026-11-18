# GalleryTile

Одна плитка галереї результатів: пара **before/after** 2×1 (дві квадратні фото поруч), опційно AI-бейдж і підпис.

## API

```ts
interface GalleryImage {
  src: string;
  alt: string;
}

interface GalleryTileProps {
  before: GalleryImage;
  after: GalleryImage;
  ai?: boolean;         // показує <Badge tone="accent">AI</Badge>
  caption?: string;
  className?: string;
}
```

- `alt` обов'язковий для обох фото (доступність, слики з WCAG-політики).
- Тіло — `<figure>` + `<figcaption>`.

## Стани

Статичний (фото + текст).

## Приклад

```tsx
<GalleryTile
  before={{ src: '/before/1.jpg', alt: 'До стрижки' }}
  after={{ src: '/after/1.jpg', alt: 'Після стрижки' }}
  ai
  caption="Фейд 3 мм"
/>
```

## Do / Don't

- ✓ кожна пара результатів — через GalleryTile (не два <img> вручну).
- ✓ AI-результати позначати `ai` (чесність, політика AI).
- ✗ не без alt — це гейт доступності, не прикраса.
- ✗ не використовувати для одинарних фото — тільки пара before/after.