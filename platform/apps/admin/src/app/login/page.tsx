'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertBanner, Button, TextField } from '@fade/ui';
import lockupUrl from '@fade/brand-assets/assets/lockup-on-dark.svg';

/** Admin login (T-013) – username + password against /admin/auth/login. */
export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? 'Login failed');
      }
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface-raised p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <img src={lockupUrl} alt="Логотип Fade" className="h-7 w-auto mb-2" />
          <p className="font-display text-h3 font-semibold">· Admin</p>
          <p className="mt-1 text-body text-fg-muted">Панель керування мережею барбершопів</p>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <p className="mb-4 text-center text-xs text-fg-muted">Dev admin: owner / FadeOwner2026</p>
        )}
        <form className="space-y-4" onSubmit={login}>
          <TextField
            label="Ім’я користувача"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Пароль"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={busy || !username || !password}
            loading={busy}
          >
            {busy ? 'Вхід…' : 'Увійти'}
          </Button>
          {error && (
            <AlertBanner tone="error" title="Помилка входу">
              {error}
            </AlertBanner>
          )}
        </form>
      </div>
    </div>
  );
}
