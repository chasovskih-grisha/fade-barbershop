// Генератор «картинок» для FakeAiGenerationGateway: детерміновані SVG-плейсхолдери
// варіантів. Жодних залежностей і зовнішніх мережевих викликів — щоб фейк був
// повністю герметичним (ADR 0019: фейк порту не має зовнішніх ефектів) і однаково
// працював офлайн. Палітра/підпис за индексом — варіанти візуально різні.

const PALETTE: readonly { bg: string; fg: string; accent: string }[] = [
  { bg: '#1f2933', fg: '#f5f7fa', accent: '#4c9aff' },
  { bg: '#22333b', fg: '#e6f0f1', accent: '#38b2ac' },
  { bg: '#2b2d42', fg: '#f0f0f0', accent: '#ef8354' },
  { bg: '#16324f', fg: '#d8f3dc', accent: '#ffd166' },
];

const DEFAULT_TONE = { bg: '#101418', fg: '#e7e9ea', accent: '#f2b705' };

const STYLE_LABELS: readonly string[] = ['корочка', 'боб', 'undercut', 'каре'];

/** SVG-байти варіанта: підпис + «силует» — щоб у кабінеті було видно, що це варіант. */
export function fakeVariantSvg(index: number, total: number): Uint8Array {
  const fallback = PALETTE[0];
  const tone = PALETTE[index % PALETTE.length] ?? fallback ?? DEFAULT_TONE;
  const label = STYLE_LABELS[index % STYLE_LABELS.length] ?? `варіант ${index + 1}`;
  const bars = Array.from({ length: total }, (_, i) => {
    const active = i <= index;
    return `<rect x="40" y="${190 + i * 16}" width="${active ? 200 : 120}" height="8" rx="4"
      fill="${active ? tone.accent : tone.fg}" opacity="${active ? 0.9 : 0.25}" />`;
  }).join('\n    ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="320" viewBox="0 0 512 320">
  <rect width="512" height="320" fill="${tone.bg}" />
  <circle cx="120" cy="110" r="58" fill="${tone.accent}" opacity="0.85" />
  <rect x="96" y="168" width="48" height="120" rx="24" fill="${tone.accent}" opacity="0.5" />
  <text x="200" y="96" font-family="system-ui, sans-serif" font-size="26" fill="${tone.fg}">
    ${label}
  </text>
  <text x="200" y="130" font-family="system-ui, sans-serif" font-size="15" fill="${tone.fg}" opacity="0.7">
    AI-варіант ${index + 1} з ${total}
  </text>
  ${bars}
</svg>`;

  return new TextEncoder().encode(svg);
}
