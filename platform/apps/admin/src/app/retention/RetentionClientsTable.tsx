import { Button } from '@fade/ui';
import type { InactiveClient } from './retention-data';

export default function RetentionClientsTable({
  clients,
  onCalculate,
}: {
  clients: InactiveClient[];
  onCalculate: (client: InactiveClient) => void;
}) {
  return (
    <div className="bg-white rounded-card border border-line shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-line flex justify-between items-center">
        <div>
          <h3 className="font-display text-h4 font-bold text-fg">
            Черга реактивації неактивних клієнтів
          </h3>
          <p className="text-sm text-fg-muted">
            Виберіть клієнта для розрахунку персоналізованої знижки та запуску SMS/Push Win-Back
            пропозиції.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-sunken text-fg-secondary text-xs font-semibold uppercase tracking-wider border-b border-line">
              <th className="px-6 py-3">Клієнт</th>
              <th className="px-6 py-3">Останній візит</th>
              <th className="px-6 py-3">Візити</th>
              <th className="px-6 py-3">Витрачено</th>
              <th className="px-6 py-3 text-right">Дія</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-sm">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-surface-sunken transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-fg">{client.name}</p>
                  <p className="text-xs text-fg-muted">{client.phone}</p>
                </td>
                <td className="px-6 py-4 text-fg">{client.lastVisitDate}</td>
                <td className="px-6 py-4 text-fg">{client.visitsCount}</td>
                <td className="px-6 py-4 font-semibold text-fg">{client.totalSpent} UAH</td>
                <td className="px-6 py-4 text-right">
                  <Button variant="secondary" onClick={() => onCalculate(client)}>
                    Розрахувати Win-Back
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
