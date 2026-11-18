// Тексти правок для Gemini: лише зачіска, обличчя лишається тим самим.
// Кількість — variantCount запиту (3–4, AI-WEB-04).

const STYLES: readonly string[] = [
  'a short buzz crop with a clean hairline',
  'a classic short side part, neat and barbershop-finished',
  'a modern undercut with textured length on top',
  'a blunt jaw-length bob with a straight fringe',
];

export function haircutPrompts(count: number): string[] {
  const total = Math.min(Math.max(count, 1), STYLES.length);
  return STYLES.slice(0, total).map(
    (style) =>
      `Edit this portrait. Change only the hair to ${style}. Keep the same person, face, identity, beard, expression, clothing, background, lighting, and framing. Photorealistic photograph, no text, no watermark.`
  );
}
