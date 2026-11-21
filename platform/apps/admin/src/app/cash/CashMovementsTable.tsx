import { isOutflow, type CashMovement } from './cash-model';

export default function CashMovementsTable({
  movements,
  locationCode,
}: {
  movements: CashMovement[];
  locationCode: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface-raised overflow-hidden">
      <div className="p-4 border-b border-line flex items-center justify-between">
        <h3 className="font-display text-h4 font-bold">
          Журнал рухів готівки по локації {locationCode}
        </h3>
        <span className="text-caption text-fg-muted">Всього записів: {movements.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line bg-surface-base text-caption text-fg-muted">
              <th className="p-3">Час</th>
              <th className="p-3">Тип</th>
              <th className="p-3">Сума</th>
              <th className="p-3">Автор</th>
              <th className="p-3">Причина</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => {
              const outflow = isOutflow(movement.type);
              return (
                <tr key={movement.id} className="border-b border-line/50 text-body">
                  <td className="p-3 text-caption text-fg-muted">
                    {new Date(movement.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 font-medium capitalize">{movement.type.replace(/_/g, ' ')}</td>
                  <td
                    className={`p-3 font-bold ${outflow ? 'text-semantic-danger' : 'text-semantic-success'}`}
                  >
                    {outflow ? '-' : '+'}
                    {movement.amount} ₴
                  </td>
                  <td className="p-3">{movement.author}</td>
                  <td className="p-3 text-fg-muted">{movement.reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
