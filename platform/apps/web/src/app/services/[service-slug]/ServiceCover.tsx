import Image from 'next/image';

interface ServiceCoverProps {
  name: string;
  price: number;
  coverImage: string;
}

export function ServiceCover({ name, price, coverImage }: ServiceCoverProps) {
  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden group">
      <Image
        src={coverImage}
        alt={name}
        width={1280}
        height={384}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjgwIDM4NCI+PHJlY3Qgd2lkdGg9IjEyODAiIGhlaWdodD0iMzg0IiBmaWxsPSIjMTMxNDE4Ii8+PC9zdmc+"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent opacity-90" />
      <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-fg text-xs font-semibold uppercase tracking-wider mb-2 shadow-md">
            Преміум сервіс
          </span>
          <h1 className="font-display text-3xl md:text-display font-bold text-fg drop-shadow-sm">
            {name}
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs text-fg-muted block">Вартість</span>
          <span className="font-display text-3xl md:text-4xl font-bold text-accent">
            {price} грн
          </span>
        </div>
      </div>
    </div>
  );
}
