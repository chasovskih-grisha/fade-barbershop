import type { CohortData } from './cohort-retention-data';

export default function CohortRetentionTable({ cohorts }: { cohorts: CohortData[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line text-body-sm text-fg-secondary">
            <th className="py-3 px-4 font-semibold">Когорта</th>
            <th className="py-3 px-4 font-semibold">Початкові користувачі</th>
            <th className="py-3 px-4 font-semibold">Місяць 0</th>
            <th className="py-3 px-4 font-semibold">Місяць 1</th>
            <th className="py-3 px-4 font-semibold">Місяць 2</th>
            <th className="py-3 px-4 font-semibold">Місяць 3</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-body">
          {cohorts.map((row) => (
            <tr key={row.cohortMonth} className="hover:bg-surface-raised transition-colors">
              <td className="py-3 px-4 font-medium text-fg">{row.cohortMonth}</td>
              <td className="py-3 px-4 text-fg-secondary">{row.initialUsers}</td>
              <td className="py-3 px-4 bg-accent/20 font-semibold text-fg">{row.month0}%</td>
              <td className="py-3 px-4 bg-accent/15 font-semibold text-fg">{row.month1}%</td>
              <td className="py-3 px-4 bg-accent/10 font-semibold text-fg">{row.month2}%</td>
              <td className="py-3 px-4 bg-accent/5 font-semibold text-fg">{row.month3}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
