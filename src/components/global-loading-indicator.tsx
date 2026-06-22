"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { cn } from "@/lib/client-utils";

export const GlobalLoadingIndicator = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching > 0 || isMutating > 0;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-100 h-1 transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <div className="h-full w-full bg-primary/20 relative overflow-hidden">
        {isLoading && (
          <div className="h-full bg-primary absolute top-0 w-[30%] animate-[loading_1.5s_linear_infinite]" />
        )}
      </div>
    </div>
  );
};
