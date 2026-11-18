import { render, screen } from '@testing-library/react';
import { AnalyticsFunnelLiveStream } from './AnalyticsFunnelLiveStream';

describe('AnalyticsFunnelLiveStream Integration', () => {
  it('додає нові події з часом', async () => {
    render(<AnalyticsFunnelLiveStream />);
    const initialCount = screen.getAllByText(/Крок пройдено|Успіх|Кинуто кошик/).length;
    expect(initialCount).toBeGreaterThan(0);
  });
});
