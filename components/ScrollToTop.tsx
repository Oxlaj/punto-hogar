"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Forces window scroll to top and moves keyboard focus to the main content
 * region whenever the pathname changes. Helps when sticky headers + soft
 * navigations cause the scroll position to be preserved and confuse users.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current !== null && lastPath.current !== pathname) {
      // Try instant first to avoid visual jump with sticky header offset
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      // Fallback if browser ignores 'instant'
      if (window.scrollY !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
      const main = document.getElementById('main-content');
      if (main) {
        // Delay focus slightly so that Next has painted new content
        requestAnimationFrame(() => {
          (main as HTMLElement).focus({ preventScroll: true });
        });
      }
    }
    lastPath.current = pathname;
  }, [pathname]);

  return null;
}
