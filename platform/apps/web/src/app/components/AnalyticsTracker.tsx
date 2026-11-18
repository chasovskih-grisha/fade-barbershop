'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { persistUtmParams, publicPageAnalytics } from '@/lib/analytics';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const search = window.location && window.location.search ? window.location.search : '';
      // Persist UTM parameters from current URL search query
      persistUtmParams(search);

      // Determine readable page name from pathname
      let pageName = 'Home';
      if (pathname === '/') pageName = 'Home';
      else if (pathname?.startsWith('/locations')) pageName = 'Locations';
      else if (pathname?.startsWith('/services')) pageName = 'Services';
      else if (pathname?.startsWith('/barbers')) pageName = 'Barbers';
      else if (pathname?.startsWith('/blog')) pageName = 'Blog';
      else if (pathname?.startsWith('/login')) pageName = 'Login';
      else if (pathname?.startsWith('/booking')) pageName = 'Booking';
      else if (pathname?.startsWith('/account')) pageName = 'ClientCabinet';
      else if (pathname?.startsWith('/support')) pageName = 'Support';

      const fullPath = (pathname || '/') + search;
      publicPageAnalytics.pageView(pageName, fullPath);
    } catch {
      // ignore tracking errors in test/SSR environments
    }
  }, [pathname]);

  return null;
}
