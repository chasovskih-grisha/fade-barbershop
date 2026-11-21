import { useState } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';
import { getIconSize, getInitials, type AvatarSize } from './avatar-models';

// Візуальний вміст аватара: фото з фолбеком на ініціали та іконку.
// Окремий компонент тримає основний Avatar у межах ADR 0019.

export function AvatarVisual({
  src,
  alt,
  name,
  size,
}: {
  src?: string | null | undefined;
  alt?: string | undefined;
  name?: string | undefined;
  size: AvatarSize;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const initials = getInitials(name);
  const imageLabel = alt || name || 'Avatar';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={imageLabel}
        loading="lazy"
        decoding="async"
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          imgLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    );
  }

  if (initials) return <span className="font-semibold uppercase">{initials}</span>;

  return <Icon name="user" size={getIconSize(size)} />;
}
