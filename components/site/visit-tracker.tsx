'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSiteData } from '@/components/site/data-provider';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function VisitTracker() {
  const pathname = usePathname();
  const { ready, updateData } = useSiteData();
  const lastCountedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !pathname || lastCountedPath.current === pathname) return;
    lastCountedPath.current = pathname;

    const today = localDateKey();
    const visitorKey = `pvl-notes:visitor:${today}`;
    const isNewVisitor = window.sessionStorage.getItem(visitorKey) !== 'counted';
    if (isNewVisitor) window.sessionStorage.setItem(visitorKey, 'counted');

    updateData((current) => {
      const found = current.visits.some((item) => item.date === today);
      const visits = found
        ? current.visits.map((item) =>
            item.date === today
              ? {
                  ...item,
                  views: item.views + 1,
                  visitors: item.visitors + (isNewVisitor ? 1 : 0),
                }
              : item,
          )
        : [
            ...current.visits,
            { date: today, visitors: isNewVisitor ? 1 : 0, views: 1 },
          ];
      return { ...current, visits };
    });
  }, [pathname, ready, updateData]);

  return null;
}
