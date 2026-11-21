'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { persistUtmParams, publicPageAnalytics } from '@/lib/analytics';
import { resolvePageName } from './analytics-page-name';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const search = window.location && window.location.search ? window.location.search : '';
      // Persist UTM parameters from current URL search query
      persistUtmParams(search);

      // Determine readable page name from pathname
      const pageName = resolvePageName(pathname);

      const fullPath = (pathname || '/') + search;
      publicPageAnalytics.pageView(pageName, fullPath);
    } catch {
      // ignore tracking errors in test/SSR environments
    }
  }, [pathname]);

  return null;
}
