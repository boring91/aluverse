import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/client-utils";

export function NavigationProgress() {
  const isNavigating = useRouterState({
    select: (state) => state.status === "pending",
  });

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeOut = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (isNavigating) {
      active.current = true;
      if (fadeOut.current) {
        clearTimeout(fadeOut.current);
      }

      setVisible(true);
      setProgress((value) => (value < 12 ? 12 : value));

      trickle.current = setInterval(() => {
        setProgress((value) =>
          value >= 90 ? value : value + Math.max((92 - value) * 0.06, 0.4),
        );
      }, 220);
    } else if (active.current) {
      active.current = false;
      if (trickle.current) {
        clearInterval(trickle.current);
      }

      setProgress(100);
      fadeOut.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 360);
    }

    return () => {
      if (trickle.current) {
        clearInterval(trickle.current);
      }
    };
  }, [isNavigating]);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5"
    >
      <div
        role="progressbar"
        aria-label="Loading page"
        className={cn(
          "absolute inset-s-0 top-0 h-full rounded-e-full",
          "bg-linear-to-r from-amber via-amber2 to-rose",
          "shadow-[0_0_10px_var(--color-amber),0_0_4px_var(--color-amber2)]",
          "transition-[width,opacity] duration-300 ease-out",
          progress >= 100 && "opacity-0",
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
