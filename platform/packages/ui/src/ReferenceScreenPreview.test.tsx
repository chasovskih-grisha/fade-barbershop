import { render, screen } from '@testing-library/react';
import { ReferenceScreenPreview } from './ReferenceScreenPreview';

describe('ReferenceScreenPreview', () => {
  it('renders web-home reference screen with correct a11y and tokens', () => {
    render(<ReferenceScreenPreview screenType="web-home" data-testid="preview" />);
    const preview = screen.getByTestId('preview');
    expect(preview.getAttribute('role')).toBe('region');
    expect(preview.getAttribute('aria-label')).toBe('Reference screen: web-home');
    expect(screen.getByText('web-home')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Action for web-home' })).toBeTruthy();
  });

  it('renders admin-shell reference screen', () => {
    render(<ReferenceScreenPreview screenType="admin-shell" data-testid="preview" />);
    expect(screen.getByText('admin-shell')).toBeTruthy();
  });

  it('renders slot-flow reference screen', () => {
    render(<ReferenceScreenPreview screenType="slot-flow" data-testid="preview" />);
    expect(screen.getByText('slot-flow')).toBeTruthy();
  });

  it('renders mobile-home reference screen', () => {
    render(<ReferenceScreenPreview screenType="mobile-home" data-testid="preview" />);
    expect(screen.getByText('mobile-home')).toBeTruthy();
  });
});
