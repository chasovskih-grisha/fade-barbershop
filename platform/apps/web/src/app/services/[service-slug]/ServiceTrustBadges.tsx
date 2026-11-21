interface ServiceTrustBadgesProps {
  duration: number;
}

export function ServiceTrustBadges({ duration }: ServiceTrustBadgesProps) {
  const badges = [
    { icon: '⏱', label: 'Тривалість', value: `${duration} хв` },
    { icon: '🛡', label: 'Гарантія якості', value: '100% результат' },
    { icon: '⭐', label: 'Рейтинг послуги', value: '4.9 / 5.0 (120+)' },
    { icon: '☕', label: 'Бонус', value: 'Напої у лаунжі' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-line">
      {badges.map((badge) => (
        <div key={badge.label} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
            {badge.icon}
          </div>
          <div>
            <p className="text-xs text-fg-muted">{badge.label}</p>
            <p className="text-sm font-semibold text-fg">{badge.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
