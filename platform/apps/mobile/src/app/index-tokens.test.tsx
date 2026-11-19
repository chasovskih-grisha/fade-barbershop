// T-2100c: головний екран застосунку (еталонний екран) малюється токенами,
// а не сирими hex. Навігація і поле входу — з `@fade/design-tokens`.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { tokens } from '@fade/design-tokens';
import { IndexNav } from './index-nav';
import { IndexLogin } from './index-login';

const COLOR = tokens.color;

const nav = (activeTab: 'home' | 'login') =>
  render(
    <IndexNav
      activeTab={activeTab}
      signedIn={false}
      sessionName={undefined}
      onHome={jest.fn()}
      onLogin={jest.fn()}
      onAccount={jest.fn()}
      onVisits={jest.fn()}
    />
  );

describe('T-2100c: mobile home uses design tokens', () => {
  it('active nav item takes text.primary, the rest text.muted', () => {
    nav('home');
    expect(screen.getByText('Головна').props.style.color).toBe(COLOR.text.primary.value);
    expect(screen.getByText('Мої візити').props.style.color).toBe(COLOR.text.muted.value);
  });

  it('the login field takes surface.raised and text.primary', () => {
    render(
      <IndexLogin
        phone=""
        setPhone={jest.fn()}
        submitting={false}
        onLogin={jest.fn()}
        biometricAvailable={false}
        biometricError={null}
        onBiometric={jest.fn()}
      />
    );
    const input = screen.getByLabelText('Телефон');
    expect(input.props.style.backgroundColor).toBe(COLOR.surface.raised.value);
    expect(input.props.style.color).toBe(COLOR.text.primary.value);
  });
});
