import { useRouter } from 'expo-router';
import WaitlistClientScreen from './WaitlistClientScreen';

export default function WaitlistPage() {
  const router = useRouter();
  return <WaitlistClientScreen visible onClose={() => router.back()} />;
}
