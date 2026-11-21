import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsFunnelLiveStream } from './AnalyticsFunnelLiveStream';

describe('AnalyticsFunnelLiveStream', () => {
  it('рендерить потік телеметрії та дозволяє ставити на паузу', () => {
    render(<AnalyticsFunnelLiveStream />);
    expect(
      screen.getByText('Потоковий моніторинг телеметрії воронок (ANL-LIVE-03)')
    ).toBeInTheDocument();

    const pauseButton = screen.getByRole('button', { name: /пауза потоку/i });
    expect(pauseButton).toBeInTheDocument();

    fireEvent.click(pauseButton);
    expect(screen.getByRole('button', { name: /продовжити потік/i })).toBeInTheDocument();
  });
});
