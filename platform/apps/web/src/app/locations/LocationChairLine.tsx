import type { Chair } from '@/lib/api/locations';

// T-4830a: одна лінія про крісла на картці списку й на сторінці студії — те
// саме речення, а не два маркетингові написи. Лічильник рахує активні крісла,
// іменоване крісло показує ім'я; понад два імені стискаються до «+N», але
// лічильник лишається видимим. Жодного пульсу й «приватного формату».

function chairCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} крісло`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} крісла`;
  return `${count} крісел`;
}

export function LocationChairLine({ chairs }: { chairs: Chair[] }) {
  const active = chairs.filter((chair) => chair.active);
  if (active.length === 0) return null;

  const names = active.map((chair) => chair.name).filter((name): name is string => Boolean(name));
  const label =
    names.length > 0
      ? `Крісла: ${names.slice(0, 2).join(', ')}${active.length > 2 ? ` +${active.length - 2}` : ''}`
      : chairCount(active.length);

  return <p className="text-caption text-fg-secondary">{label}</p>;
}
