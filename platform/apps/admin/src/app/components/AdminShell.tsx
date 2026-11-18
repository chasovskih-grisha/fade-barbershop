'use client';

// Каркас адмінки: auth-гейт один тут (root layout), сторінки рендерять лише
// вміст. Схема «сайдбар + контент» на h-screen: скролиться лише колонка
// контенту, тож навігація й хедер лишаються на екрані на будь-якій глибині
// прокрутки (сайдбар «зникав» на довгих таблицях, бо контейнер був min-h-screen).
import { useEffect, useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import { useViewport, breakpointBelow, ADMIN_LG_PX } from '@fade/ui';
import { OfflineStatusBar } from './OfflineResilienceProvider';

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const onLogin = pathname === '/login';
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { breakpoint } = useViewport();
  const narrow = breakpointBelow(breakpoint, ADMIN_LG_PX);

  // Мобільний drawer закривається, коли вікно перестає бути вузьким.
  const effectiveSidebarOpen = narrow ? sidebarOpen : false;

  useEffect(() => {
    setSidebarOpen(narrow ? sidebarOpen : false);
  }, [narrow, sidebarOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/admin/auth/me', { credentials: 'include' });
        if (res.ok) {
          setAuthenticated(true);
          if (onLogin) router.replace('/');
        } else if (!onLogin) {
          router.replace('/login');
        }
      } catch {
        if (!onLogin) router.replace('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router, onLogin]);

  // Мобільний drawer не має пережити зміну маршруту: стан його відкриття живе
  // тут, тож будь-який новий pathname (редірект auth-гейта, router.back() з
  // самого drawer, навігація ззовні) закриває його без окремого контексту.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Форма входу — теж дитина shell. Без сесії раніше повертався null,
  // тож після редіректу на /login екран лишався порожнім.
  if (onLogin && !authenticated) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <OfflineStatusBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={effectiveSidebarOpen} onOpenChange={setSidebarOpen} narrow={narrow} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMobileMenuToggle={() => setSidebarOpen((v) => !v)} showBurger={narrow} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

// Fork: стан розкриття мобільного сайдбару живе тут, аби не плодити контексти —
// скільки образів адмінки не рендерилося одночасно, хвостики редіректів
// /login → / не запускають два одночасноactive селектори.
export function useAdminSidebarOpen(initial = false) {
  return useState(initial);
}
