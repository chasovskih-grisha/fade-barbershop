import Image from 'next/image';
import lockup from '@fade/brand-assets/assets/lockup-on-dark.svg';
import { assetUrl } from '@/lib/asset-url';

const LOCKUP_SRC =
  typeof lockup === 'string' && lockup === 'test-file-stub'
    ? '/lockup-on-dark.svg'
    : assetUrl(lockup);

export function BrandLockup({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <Image src={LOCKUP_SRC} alt="FADE" width={620} height={246} className={className} priority />
  );
}
