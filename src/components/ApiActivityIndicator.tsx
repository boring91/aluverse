import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/client-utils";

// Once shown, keep the spinner up for at least this long so fast requests
// (localhost responses can resolve in tens of ms) still register visually
// instead of flickering past the eye.
const MIN_VISIBLE_MS = 500;

/**
 * Shows an indefinite (spinner) indicator whenever any tRPC/React Query request
 * is in flight. Appears immediately on activity and lingers for a short minimum
 * so brief requests are still perceptible.
 */
export function ApiActivityIndicator() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isBusy = isFetching > 0 || isMutating > 0;

  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isBusy) {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      if (!visible) {
        shownAt.current = Date.now();
        setVisible(true);
      }
      return;
    }

    if (!visible) {
      return;
    }

    const elapsed = Date.now() - shownAt.current;
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);
    hideTimer.current = setTimeout(() => setVisible(false), remaining);

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [isBusy, visible]);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none fixed bottom-4 end-4 z-100",
        "flex items-center gap-2 rounded-full px-3 py-2",
        "border border-border bg-background/80 shadow-md backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        visible ? "opacity-100" : "translate-y-2 opacity-0",
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner className="text-amber" />
    </div>
  );
}
