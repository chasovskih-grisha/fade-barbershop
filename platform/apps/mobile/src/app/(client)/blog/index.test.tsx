import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import BlogFeedScreen from './index';
import * as articlesApi from '../../../lib/api/articles';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../../lib/api/articles');

const summary = {
  id: 'a-1',
  slug: 'fade-cut',
  title: 'Як доглядати за fade',
  excerpt: 'Коротко про догляд',
  coverUrl: null,
  authorName: 'Fade Team',
  tags: [],
  publishedAt: '2026-11-01T09:00:00.000Z',
};

describe('BlogFeedScreen (T-2300f)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens an article from the feed card', async () => {
    jest.spyOn(articlesApi, 'fetchArticleFeed').mockResolvedValueOnce([summary]);

    render(<BlogFeedScreen />);
    expect(screen.getByTestId('blog-loading')).toBeTruthy();

    await waitFor(() => expect(screen.getByTestId('blog-card-fade-cut')).toBeTruthy());
    fireEvent.press(screen.getByTestId('blog-card-fade-cut'));
    expect(mockPush).toHaveBeenCalledWith('/(client)/blog/fade-cut');
  });

  it('shows an empty state, not an error, for an empty feed', async () => {
    jest.spyOn(articlesApi, 'fetchArticleFeed').mockResolvedValueOnce([]);

    render(<BlogFeedScreen />);

    await waitFor(() => expect(screen.getByTestId('blog-empty')).toBeTruthy());
    expect(screen.queryByTestId('blog-retry')).toBeNull();
  });

  it('offers a retry when the feed fails', async () => {
    const feed = jest
      .spyOn(articlesApi, 'fetchArticleFeed')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([summary]);

    render(<BlogFeedScreen />);

    await waitFor(() => expect(screen.getByTestId('blog-retry')).toBeTruthy());
    fireEvent.press(screen.getByTestId('blog-retry'));

    await waitFor(() => expect(screen.getByTestId('blog-card-fade-cut')).toBeTruthy());
    expect(feed).toHaveBeenCalledTimes(2);
  });
});
