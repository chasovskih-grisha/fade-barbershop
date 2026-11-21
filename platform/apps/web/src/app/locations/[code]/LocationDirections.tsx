import { Card } from '@fade/ui';

export function LocationDirections({ address }: { address: string }) {
  return (
    <Card className="p-5 flex flex-col gap-4 border-border bg-surface-raised">
      <h3 className="font-semibold text-h5">Як дістатися та транспорт</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-fg-secondary">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-fg">🚇 На метро</span>
          <p>
            5-7 хвилин пішки від центральної станції району. Зручний пішохідний маршрут
            безперебійними тротуарами.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-fg">🚗 На автомобілі</span>
          <p>
            Парковка безпосередньо біля входу ({address}). Завжди є вільні місця для гостей студії.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-fg">☕ Гостинність</span>
          <p>Чиста вода, гарячий рушник та ароматна кава чекають на вас з першої хвилини візиту.</p>
        </div>
      </div>
    </Card>
  );
}
