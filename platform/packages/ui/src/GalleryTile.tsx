import { useState } from 'react';
import { cn } from './cn';
import { Badge } from './Badge';

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface GalleryTileProps extends React.HTMLAttributes<HTMLElement> {
  before: GalleryImage;
  after: GalleryImage;
  ai?: boolean;
  caption?: string;
  className?: string;
}

export function GalleryTile({
  before,
  after,
  ai = false,
  caption,
  className,
  ...rest
}: GalleryTileProps) {
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);

  return (
    <figure className={cn('flex flex-col gap-2', className)} {...rest}>
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-input bg-surface-raised">
        <img
          src={before.src}
          alt={before.alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setBeforeLoaded(true)}
          className={cn(
            'aspect-square w-full object-cover transition-opacity duration-300',
            beforeLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
        <img
          src={after.src}
          alt={after.alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setAfterLoaded(true)}
          className={cn(
            'aspect-square w-full object-cover transition-opacity duration-300',
            afterLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
      <figcaption className="flex items-center gap-2 text-caption text-fg-muted">
        {ai ? <Badge tone="accent">AI</Badge> : null}
        {caption}
      </figcaption>
    </figure>
  );
}
