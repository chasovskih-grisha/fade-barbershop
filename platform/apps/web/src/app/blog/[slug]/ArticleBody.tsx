import type { ArticleBlock } from '@fade/contracts';

// Тіло статті — структуровані блоки з API (T-2300a), а не HTML: клієнт малює
// структуру, а не виконує розмітку із CMS. Чернетка без блоків лишається
// абзацами з `body`, щоб сторінка не була порожньою.

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'heading':
      return block.level === 2 ? (
        <h2 className="font-display text-h2">{block.text}</h2>
      ) : (
        <h3 className="font-display text-h3">{block.text}</h3>
      );
    case 'list':
      return (
        <ul className="list-disc pl-6">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote className="border-l-2 border-accent pl-4 italic text-fg-secondary">
          {block.text}
        </blockquote>
      );
    case 'image':
      return (
        <figure className="flex flex-col gap-2">
          {/* Хост зображення задає редактор — оптимізатор Next його не знає. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.src}
            alt={block.alt}
            loading="lazy"
            className="h-auto w-full rounded-card"
          />
          {block.caption && (
            <figcaption className="text-body-s text-fg-muted">{block.caption}</figcaption>
          )}
        </figure>
      );
    default:
      return <p>{block.text}</p>;
  }
}

export function ArticleBody({ blocks, body }: { blocks?: ArticleBlock[]; body: string }) {
  if (blocks && blocks.length > 0) {
    return (
      <div className="flex flex-col gap-4 text-body text-fg">
        {blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>
    );
  }

  const paragraphs = body
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
