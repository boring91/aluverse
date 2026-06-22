import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Full-screen overlay shown while the router resolves the next route. It keys
 * off `isLoading` (true for the whole navigation/commit cycle, even when routes
 * have no loaders) and waits a beat before showing so instant navigation doesn't
 * flash an overlay.
 */
export function NavigationLoader() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const pendingPath = useRouterState({ select: (s) => s.location.pathname });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }
    const id = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(id);
  }, [isLoading]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/85 backdrop-blur-sm duration-200">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-amber" />
          <span className="text-[10px] tracking-[0.3em] text-amber uppercase">
            loading route
          </span>
        </div>

        <div className="relative h-1 w-72 overflow-hidden rounded-full border border-border bg-card">
          <div className="absolute inset-y-0 start-0 w-1/3 animate-[nav-scan_1.4s_ease-in-out_infinite] bg-linear-to-r from-amber via-amber2 to-rose" />
        </div>

        <div className="text-[11px] tracking-wider text-muted-foreground">
          <span>{pendingPath}</span>
          <span className="blink">_</span>
        </div>
      </div>
    </div>
  );
}
