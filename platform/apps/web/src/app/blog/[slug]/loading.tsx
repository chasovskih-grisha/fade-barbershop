import { Skeleton } from '@fade/ui';

// Скелет сторінки статті: заголовок, метадані й абзаци — форма майбутнього
// вмісту, щоб сторінка не «стрибала» після завантаження.

export default function ArticleLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10" aria-hidden>
      <Skeleton variant="text" className="h-10 w-3/4" />
      <Skeleton variant="text" className="w-1/3" />
      <Skeleton variant="rect" className="h-56 w-full rounded-card" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  );
}
