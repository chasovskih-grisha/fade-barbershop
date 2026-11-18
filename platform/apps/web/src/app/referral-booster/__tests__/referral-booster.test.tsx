import { render, screen, fireEvent } from '@testing-library/react';
import ReferralBoosterPage from '../page';

describe('ReferralBoosterPage', () => {
  it('renders referral booster heading and code', () => {
    render(<ReferralBoosterPage />);
    expect(screen.getByText('Referral Booster & VIP Tiers')).toBeInTheDocument();
    expect(screen.getByText('FADE-VIP-2026')).toBeInTheDocument();
  });

  it('allows incrementing referrals and unlocking tiers', () => {
    render(<ReferralBoosterPage />);
    expect(screen.getByText('Запрошено друзів:')).toBeInTheDocument();
    
    const increaseBtn = screen.getByText('+ Збільшити');
    fireEvent.click(increaseBtn);

    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Отримати бонус').length).toBeGreaterThan(0);
  });
});
