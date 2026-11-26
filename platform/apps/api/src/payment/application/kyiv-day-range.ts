// Київська доба → [початок, кінець) для зведень грошей. Зсув береться на ту
// саму мить, тож літній/зимовий час не зсуває межі дня; окремий файл, щоб
// read-моделі не тягли Intl-логіку одна від одної.
export function kyivDayRange(date: string): { from: Date; to: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const utcMidnight = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(utcMidnight.getTime())) return null;
  const from = new Date(utcMidnight.getTime() - kyivOffsetMinutes(utcMidnight) * 60_000);
  return { from, to: new Date(from.getTime() + 24 * 60 * 60_000) };
}

function kyivOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(at);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour') % 24,
    value('minute')
  );
  return (asUtc - at.getTime()) / 60_000;
}
