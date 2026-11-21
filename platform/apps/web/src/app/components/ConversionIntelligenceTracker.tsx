'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { conversionIntelligence } from '@/lib/analytics';

export function ConversionIntelligenceTracker() {
  const pathname = usePathname();
  const trackedMilestones = useRef<Set<number>>(new Set());
  const clickHistory = useRef<{ time: number; target: string }[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reset tracked milestones on pathname change
    trackedMilestones.current.clear();

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight <= 0) return;

      const progress = Math.round((scrollTop / scrollHeight) * 100);
      [25, 50, 75, 90].forEach((milestone) => {
        if (progress >= milestone && !trackedMilestones.current.has(milestone)) {
          trackedMilestones.current.add(milestone);
          conversionIntelligence.trackScrollMilestone(milestone, pathname || '/');
        }
      });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        conversionIntelligence.trackExitIntent(pathname || '/');
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const interactiveEl = target?.closest('button, a, [role="button"]');
      if (!interactiveEl) return;

      const elementName =
        interactiveEl.getAttribute('aria-label') ||
        interactiveEl.textContent?.trim().slice(0, 30) ||
        'unknown_element';
      const now = Date.now();

      // Clean up clicks older than 1000ms
      clickHistory.current = clickHistory.current.filter((c) => now - c.time < 1000);
      clickHistory.current.push({ time: now, target: elementName });

      const sameElementClicks = clickHistory.current.filter((c) => c.target === elementName);
      if (sameElementClicks.length >= 3) {
        conversionIntelligence.trackRageClick(elementName, sameElementClicks.length);
        // Clear history for this element to prevent spamming
        clickHistory.current = clickHistory.current.filter((c) => c.target !== elementName);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('click', handleClick);
    };
  }, [pathname]);

  return null;
}
