// Канальні іконки (LocationChannel: web-screens §2 — phone/email/viber/telegram/
// instagram/facebook/whatsapp/website). Той самий монохромний набір: сітка 24, stroke.
// Це не логотипи брендів, а нейтральні гліфи каналу — фірмовий знак не перемальовуємо.

export const channelIcons = {
  telegram: <path d="M21 4 3 11l5 2 2 6 3-4 5 4 1-9-8 6-1-5 10-3Z" />,
  viber: (
    <>
      <path d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 2-2Z" />
      <path d="M15 10.5a2.5 2.5 0 0 1 0 3M17.5 8a5.5 5.5 0 0 1 0 8" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-3.9A8 8 0 1 1 20 12Z" />
      <path d="M9.5 9.5c0 3 2 5 5 5 .8 0 1.5-.7 1.5-1.4l-1.8-.8-.9 1a6 6 0 0 1-2.3-2.3l1-.9-.8-1.8c-.7 0-1.7.5-1.7 1.2Z" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M16.5 7.5h.01" />
    </>
  ),
  facebook: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M14 8.5h-1a1.5 1.5 0 0 0-1.5 1.5V11h2.5l-.5 2.5H11.5V20M9 11h2.5" />
    </>
  ),
} as const;
