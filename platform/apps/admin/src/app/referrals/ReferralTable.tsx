import ReferralRow from './ReferralRow';
import type { ReferralItem } from './referral-model';

const HEADERS = [
  'Друг (Реферал)',
  'Хто привів',
  'Локація',
  'Дата реєстрації',
  'Статус',
  'Винагорода',
  "Анти-аб'юз",
  'Дії',
];

export default function ReferralTable({
  items,
  onRevoke,
}: {
  items: ReferralItem[];
  onRevoke: (item: ReferralItem) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border text-fg-secondary text-body-sm">
            {HEADERS.map((header) => (
              <th key={header} className="py-3 px-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={HEADERS.length} className="py-8 text-center text-fg-secondary">
                Рефералів за вибраними критеріями не знайдено.
              </td>
            </tr>
          ) : (
            items.map((item) => <ReferralRow key={item.id} item={item} onRevoke={onRevoke} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
