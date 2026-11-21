import { render, screen } from '@testing-library/react';
import { StatusPill, type VisitStatus } from './StatusPill';

describe('StatusPill', () => {
  it('показує український підпис статусу за замовчуванням', () => {
    render(<StatusPill status="booked" />);
    expect(screen.getByText('Заброньовано')).toBeTruthy();
  });

  it('бере тон із мапи токенів', () => {
    render(<StatusPill status="no_show" />);
    expect(screen.getByText('Не прийшов').className).toContain('text-semantic-danger');
  });

  it('дозволяє власний підпис', () => {
    render(<StatusPill status="in_progress" label="Зараз" />);
    expect(screen.getByText('Зараз')).toBeTruthy();
  });

  it('показує фокус-стан через focus-visible, не через focus', () => {
    render(<StatusPill status="confirmed" />);
    const className = screen.getByText('Підтверджено').className;
    expect(className).toContain('focus-visible:ring-2');
    expect(className).not.toMatch(/(^|\s)focus:ring/);
  });

  it('має роль status за замовчуванням та підтримує HTML атрибути', () => {
    render(<StatusPill status="confirmed" data-testid="pill" aria-label="Status confirmed" />);
    const el = screen.getByTestId('pill');
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-label')).toBe('Status confirmed');
  });

  it('має візуальне представлення для кожного статусу', () => {
    const statuses: VisitStatus[] = [
      'booked',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
      'waitlist_hold',
    ];
    for (const status of statuses) {
      const { container, unmount } = render(<StatusPill status={status} />);
      expect(container.firstChild).toBeTruthy();
      unmount();
    }
  });
});
