// Лінійні іконки одного набору (design-system.md §Радіуси…: сітка 24px, stroke 1.5–2).
// Геометрія — координати на сітці 24, колір успадковується (currentColor), заливки немає.
// Набір визначено інвентаризацією екранів фаз 2–3 (T-4506), не «на потрібне».
//
// T-4506: назва `arrow-back` — окремий символ drawera збек-навігації.

export const uiIcons = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  'chevron-left': <path d="M15 6l-6 6 6 6" />,
  'arrow-back': <path d="M15 6l-6 6 6 6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  phone: (
    <path d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 2-2Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17" />
    </>
  ),
  check: <path d="M5 13l4.5 4.5L19 7" />,
  alert: (
    <>
      <path d="M12 4.5 3.5 19.5h17L12 4.5Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  star: <path d="m12 4 2.5 5.2 5.5.8-4 4 1 5.7-5-2.7-5 2.7 1-5.7-4-4 5.5-.8L12 4Z" />,
  scissors: (
    <>
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="7" cy="17" r="2.5" />
      <path d="M9 8.5 20 17M9 15.5 20 7" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5 17 4.5-4.5L14 17M14 14l2.5-2.5L20 15" />
    </>
  ),
} as const;
