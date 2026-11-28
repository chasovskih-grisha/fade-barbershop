import { render, screen } from '@testing-library/react';
import type { ArticleBlock } from '@fade/contracts';
import { ArticleBody } from '../[slug]/ArticleBody';

// Тіло статті — блоки з API (T-2300a). Тут перевіряємо, що кожен тип блоку
// малюється структурою, а не виконуваним HTML із CMS.

const blocks: ArticleBlock[] = [
  { type: 'heading', level: 2, text: 'Догляд' },
  { type: 'heading', level: 3, text: 'Миття' },
  { type: 'paragraph', text: 'Абзац з блоку.' },
  { type: 'list', items: ['Раз', 'Два'] },
  { type: 'quote', text: 'Цитата майстра.' },
  { type: 'image', src: 'https://cdn.example/x.jpg', alt: 'Фото стрижки', caption: 'Підпис фото' },
];

describe('ArticleBody', () => {
  it('рендерить усі типи блоків тіла', () => {
    const { container } = render(<ArticleBody blocks={blocks} body="" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Догляд' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Миття' })).toBeTruthy();
    expect(screen.getByText('Абзац з блоку.')).toBeTruthy();
    expect(screen.getByText('Раз')).toBeTruthy();
    expect(screen.getByText('Два')).toBeTruthy();
    expect(screen.getByText('Цитата майстра.')).toBeTruthy();
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Фото стрижки');
    expect(screen.getByText('Підпис фото')).toBeTruthy();
  });

  it('без блоків рендерить абзаци з body, HTML не виконується', () => {
    const html = '<img src=x onerror="alert(1)">';
    const { container } = render(<ArticleBody body={`Перший.\n\n${html}`} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeTruthy();
  });
});
