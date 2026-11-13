"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Shows a skeleton while a link navigation is in flight.
 * Form submissions are ignored: they already show dots inside their own button.
 */
export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const startedAt = useRef(0);

  // Clear as soon as the new page has rendered.
  useEffect(() => {
    const shownAt = Date.now();
    const elapsed = shownAt - startedAt.current;
    const wait = Math.max(0, 220 - elapsed);
    const t = setTimeout(() => setLoading(false), wait);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function onClick(event: MouseEvent) {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) {
        return;
      }

      // Only when it is actually a different page.
      const url = new URL(anchor.href, window.location.href);
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      startedAt.current = Date.now();
      setLoading(true);
      clearTimeout(timer);
      timer = setTimeout(() => setLoading(false), 6000);
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimeout(timer);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="page-loader" aria-busy="true" aria-live="polite">
      <div className="container">
        <p className="muted small">Loading…</p>
        <div
          style={{
            height: 28,
            width: "55%",
            background: "var(--border)",
            borderRadius: 4,
            marginBottom: 18
          }}
        />
        <div className="grid two">
          {[0, 1].map((i) => (
            <div key={i} className="card" style={{ height: 120 }} aria-hidden="true">
              <div
                style={{
                  height: 12,
                  width: "40%",
                  background: "var(--border)",
                  borderRadius: 3,
                  marginBottom: 10
                }}
              />
              <div
                style={{
                  height: 12,
                  width: "70%",
                  background: "var(--border)",
                  borderRadius: 3
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
