'use client';

import { useState } from 'react';
import { Button, Icon } from '@fade/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  showBurger?: boolean;
}

/** Header for the admin shell. Shows admin identifier, logout button,
 *   і мобільний бургер зі списку — `lg` і вище прихований.
 */
export default function Header({ onMobileMenuToggle, showBurger = true }: HeaderProps) {
  const router = useRouter();
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await fetch('/admin/auth/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch admin');
        const data = (await res.json()) as {
          username?: string | null;
          name?: string | null;
          phone?: string;
        };
        setAdminName(data.username || data.name || data.phone || 'Адмін');
      } catch {
        // Деградація без логу: імʼя лишається порожнім, доступ ріже guard.
        setAdminName('');
      }
    };
    fetchAdmin();
  }, []);

  const handleLogout = async () => {
    try {
      setError('');
      const res = await fetch('/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Logout failed');
      router.push('/login');
    } catch {
      // Користувач має бачити, що вихід не стався, а не «нічого не робить».
      setError('Не вдалося вийти — спробуйте ще раз');
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-line bg-surface-base p-3">
      <div className="flex items-center gap-3">
        {/* Burger — лише нижче `lg`; на широких екранах текст залишається
         *   у хедері, меню розгортається з боку (сайдбар). */}
        {showBurger ? (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            aria-label="Відкрити меню навігації"
            aria-expanded={undefined}
            className="rounded-micro p-1.5 text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue lg:hidden"
          >
            <Icon name="menu" size={24} />
          </button>
        ) : null}
        <span className="text-body text-fg-secondary">Панель керування мережею</span>
      </div>
      <div className="flex items-center gap-4">
        {error ? (
          <span role="alert" className="text-body text-danger">
            {error}
          </span>
        ) : null}
        <span className="text-body text-fg">{adminName}</span>
        <Button variant="secondary" onClick={handleLogout}>
          Вийти
        </Button>
      </div>
    </header>
  );
}
