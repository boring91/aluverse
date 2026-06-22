import { useEffect, useRef, useCallback } from "react";

type UsePendingSelectionOptions<T extends { id: string }> = {
  items: T[] | undefined;
  onItemFound: (itemId: string) => void;
  resetDependencies?: unknown[];
};

export const usePendingSelection = <T extends { id: string }>({
  items,
  onItemFound,
  resetDependencies,
}: UsePendingSelectionOptions<T>) => {
  const pendingIdRef = useRef<string | null>(null);

  const handleCreated = useCallback((id: string) => {
    pendingIdRef.current = id;
  }, []);

  // Watch for item appearing in list
  useEffect(() => {
    if (
      pendingIdRef.current &&
      items?.some((item) => item.id === pendingIdRef.current)
    ) {
      onItemFound(pendingIdRef.current);
      pendingIdRef.current = null;
    }
  }, [items, onItemFound]);

  // Clear on reset key change
  useEffect(() => {
    pendingIdRef.current = null;
  }, resetDependencies);

  return handleCreated;
};
