import { Metadata } from 'next';
import { ReferralPageContent } from './ReferralPageContent';

export const metadata: Metadata = {
  title: 'Реферальна програма · Кабінет · FADE',
  description: 'Мій реферальний код, бонуси та статус запрошених друзів у FADE.',
};

export default function ReferralsPage() {
  return <ReferralPageContent />;
}
