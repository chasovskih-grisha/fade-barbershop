import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" alt="User Avatar" name="John Doe" />);
    const img = screen.getByAltText('User Avatar');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
  });

  it('renders initials when src is missing but name is provided', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeTruthy();
  });

  it('falls back to icon when neither src nor name is provided', () => {
    render(<Avatar />);
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('falls back to initials when image fails to load', () => {
    render(<Avatar src="https://example.com/broken.jpg" name="Alice Smith" alt="Alice" />);
    const img = screen.getByAltText('Alice');
    fireEvent.error(img);
    expect(screen.getByText('AS')).toBeTruthy();
  });

  it('renders status indicator when status prop is passed', () => {
    render(<Avatar name="Bob" status="online" />);
    const statusDot = screen.getByLabelText('Status: online');
    expect(statusDot).toBeTruthy();
  });

  it('forwards HTML attributes', () => {
    render(<Avatar name="Test User" data-testid="avatar-test" title="User Title" />);
    const avatar = screen.getByTestId('avatar-test');
    expect(avatar.getAttribute('title')).toBe('User Title');
  });

  it('provides accessibility role and label when name or alt is provided', () => {
    render(<Avatar name="John Doe" data-testid="avatar-a11y" />);
    const avatar = screen.getByTestId('avatar-a11y');
    expect(avatar.getAttribute('role')).toBe('img');
    expect(avatar.getAttribute('aria-label')).toBe('Avatar: John Doe');
  });
});
