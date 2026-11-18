// Текст статті. Текст приходить з CMS як звичайний текст (або markdown з
// порожніми рядками між абзацами), тому рендеримо абзаци, а НЕ
// dangerouslySetInnerHTML: HTML із адмінки не має виконуватись на публічному
// сайті (XSS через «статтю»).

export function ArticleBody({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-4 text-body text-fg">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
