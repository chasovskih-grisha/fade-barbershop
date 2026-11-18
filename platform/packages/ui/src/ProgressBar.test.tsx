import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('виставляє ARIA-атрибути включно з aria-valuetext', () => {
    render(<ProgressBar value={4} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('4');
    expect(bar.getAttribute('aria-valuemax')).toBe('7');
    expect(bar.getAttribute('aria-valuetext')).toBe('4 з 7');
  });

  it('обмежує значення межами', () => {
    const { rerender } = render(<ProgressBar value={-2} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    rerender(<ProgressBar value={99} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('7');
  });

  it('показує заповнені сегменти і Bone-інверсію для 7-го', () => {
    render(<ProgressBar value={7} />);
    const segments = screen.getByRole('progressbar').querySelectorAll('span');
    expect(segments).toHaveLength(7);
    expect(segments[0].className).toContain('bg-fg-secondary');
    expect(segments[6].className).toContain('bg-fg');
  });

  it('порожній прогрес лишає останній сегмент контурним', () => {
    render(<ProgressBar value={0} />);
    const segments = screen.getByRole('progressbar').querySelectorAll('span');
    expect(segments[0].className).toContain('bg-interactive');
    expect(segments[6].className).toContain('border-line-strong');
  });
});
