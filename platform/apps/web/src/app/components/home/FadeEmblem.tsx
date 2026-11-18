export function FadeEmblem({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="emblem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-semantic-info)" />
          <stop offset="50%" stopColor="var(--color-accent-blue)" />
          <stop offset="100%" stopColor="var(--color-semantic-warning)" />
        </linearGradient>
      </defs>
      {/* Outer precision geometric frame */}
      <circle cx="50" cy="50" r="46" stroke="url(#emblem-grad)" strokeWidth="1.5" strokeOpacity="0.45" />
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 4" />
      
      {/* Precision crosshairs */}
      <line x1="50" y1="4" x2="50" y2="16" stroke="url(#emblem-grad)" strokeWidth="2" strokeOpacity="0.95" />
      <line x1="50" y1="84" x2="50" y2="96" stroke="url(#emblem-grad)" strokeWidth="2" strokeOpacity="0.95" />
      <line x1="4" y1="50" x2="16" y2="50" stroke="url(#emblem-grad)" strokeWidth="2" strokeOpacity="0.95" />
      <line x1="84" y1="50" x2="96" y2="50" stroke="url(#emblem-grad)" strokeWidth="2" strokeOpacity="0.95" />

      {/* FA Monogram / Geometric Fade Lines */}
      <path
        d="M32 70V30H58C65 30 70 35 70 42C70 49 65 54 58 54H32M50 54L72 70"
        stroke="url(#emblem-grad)"
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <circle cx="50" cy="50" r="3.5" fill="url(#emblem-grad)" />
    </svg>
  );
}
