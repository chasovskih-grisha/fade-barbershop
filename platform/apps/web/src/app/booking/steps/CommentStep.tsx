import { Button } from '@fade/ui';

interface Props {
  comment: string;
  setComment: (c: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  /** Вибрані факти візиту — зі стану флоу, не з DOM (T-4736b). */
  locationName?: string | undefined;
  serviceName?: string | undefined;
  durationMinutes?: number | undefined;
  /** Каталожна ціна послуги, як на картці (без копійок, `N ₴`). */
  price?: number | undefined;
  barberName?: string | undefined;
  /** Обраний слот, `HH:mm–HH:mm`. */
  time?: string | undefined;
}

/** Екран 4 (booking-flow.md): коментар ≤500 символів (REF-WEB-02) — plain
 * text з лічильником; необов'язковий. T-4736b: перед підтвердженням клієнт
 * бачить обраний візит і каталожну ціну; розбивка знижок і депозит — T-090/T-091,
 * тож поки під фактами один рядок «Оплата на місці». */
export default function CommentStep({
  comment,
  setComment,
  onBack,
  onConfirm,
  submitting = false,
  locationName,
  serviceName,
  durationMinutes,
  price,
  barberName,
  time,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={onBack}>
        ← Повернутись
      </Button>
      <h2 className="font-display text-h4">Додайте коментар (необов’язково)</h2>

      <dl
        aria-label="Ваш візит"
        className="flex flex-col gap-1 rounded-card border border-line bg-surface-raised p-4 text-sm"
      >
        <FactRow label="Локація" value={locationName} />
        <FactRow
          label="Послуга"
          value={
            serviceName
              ? durationMinutes
                ? `${serviceName} · ${durationMinutes} хв`
                : serviceName
              : undefined
          }
        />
        <FactRow label="Ціна" value={price !== undefined ? `${price} ₴` : undefined} />
        <FactRow label="Майстер" value={barberName} />
        <FactRow label="Час" value={time} />
        <p className="pt-2 text-fg-secondary">Оплата на місці</p>
      </dl>

      {/* Підпис і лічильник зв'язані з полем (T-053av): placeholder — не ім'я. */}
      <label htmlFor="booking-comment" className="text-sm font-medium">
        Коментар до зачіски (необов’язково)
      </label>
      <textarea
        id="booking-comment"
        aria-describedby="booking-comment-counter"
        className="h-32 w-full rounded border p-2"
        maxLength={500}
        placeholder="Коментар до зачіски…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <p
        id="booking-comment-counter"
        className="text-sm text-fg-secondary"
      >{`${comment.length}/500`}</p>
      <Button loading={submitting} onClick={onConfirm}>
        Підтвердити запис
      </Button>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value?: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt className="text-fg-secondary">{label}:</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  );
}
