import React from 'react';
import { Linking } from 'react-native';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import BlogArticleScreen from './[slug]';
import * as articlesApi from '../../../lib/api/articles';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'fade-cut' }),
}));

jest.mock('../../../lib/api/articles');

const article = {
  id: 'a-1',
  slug: 'fade-cut',
  title: 'Як доглядати за fade',
  excerpt: 'Коротко про догляд',
  coverUrl: null,
  authorName: 'Fade Team',
  tags: [],
  publishedAt: '2026-11-01T09:00:00.000Z',
  body: 'Перший абзац\n\nДругий абзац',
};

describe('BlogArticleScreen (T-2300f)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the body paragraphs of the published article', async () => {
    jest.spyOn(articlesApi, 'fetchArticle').mockResolvedValueOnce({ state: 'ok', article });

    render(<BlogArticleScreen />);

    await waitFor(() => expect(screen.getByTestId('article-title')).toBeTruthy());
    expect(screen.getAllByTestId('article-paragraph')).toHaveLength(2);
  });

  it('shows "no article" for a draft or foreign slug', async () => {
    jest.spyOn(articlesApi, 'fetchArticle').mockResolvedValueOnce({ state: 'notFound' });

    render(<BlogArticleScreen />);

    await waitFor(() => expect(screen.getByTestId('article-missing')).toBeTruthy());
    expect(screen.queryByTestId('article-retry')).toBeNull();
  });

  it('opens the canonical site URL from the article', async () => {
    jest.spyOn(articlesApi, 'fetchArticle').mockResolvedValueOnce({ state: 'ok', article });
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(true);

    render(<BlogArticleScreen />);

    await waitFor(() => expect(screen.getByTestId('article-open-site')).toBeTruthy());
    fireEvent.press(screen.getByTestId('article-open-site'));
    expect(openURL).toHaveBeenCalledWith('https://fade.com.ua/blog/fade-cut');
  });

  it('offers a retry when the article request fails', async () => {
    const load = jest
      .spyOn(articlesApi, 'fetchArticle')
      .mockResolvedValueOnce({ state: 'error' })
      .mockResolvedValueOnce({ state: 'ok', article });

    render(<BlogArticleScreen />);

    await waitFor(() => expect(screen.getByTestId('article-retry')).toBeTruthy());
    fireEvent.press(screen.getByTestId('article-retry'));

    await waitFor(() => expect(screen.getByTestId('article-title')).toBeTruthy());
    expect(load).toHaveBeenCalledTimes(2);
  });
});
