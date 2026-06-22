import type { PaginationState, SortingState } from "@tanstack/react-table";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { useCallback, useMemo, useState } from "react";

type UrlKeysConfig = {
  pageIndex?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: string;
};

type Props = {
  pageIndex?: number;
  pageSize?: number;
  disableUrlKeys?: boolean;
  urlKeys?: UrlKeysConfig;
};

export const useDataTable = ({
  pageIndex: defaultPageIndex = 0,
  pageSize: defaultPageSize = 20,
  disableUrlKeys = false,
  urlKeys,
}: Props = {}) => {
  const [openCreateSheet, setOpenCreateSheet] = useState(false);

  // URL key configuration
  const pageKey = urlKeys?.pageIndex ?? "page";
  const sizeKey = urlKeys?.pageSize ?? "size";
  const sortByKey = urlKeys?.sortBy ?? "sortBy";
  const sortOrderKey = urlKeys?.sortOrder ?? "sortOrder";

  // URL state parsers
  const parsers = useMemo(
    () => ({
      page: parseAsInteger.withDefault(defaultPageIndex + 1), // 1-based in URL
      size: parseAsInteger.withDefault(defaultPageSize),
      sortBy: parseAsString,
      sortOrder: parseAsString,
    }),
    [defaultPageIndex, defaultPageSize],
  );

  const urlKeyMap = useMemo(
    () => ({
      page: pageKey,
      size: sizeKey,
      sortBy: sortByKey,
      sortOrder: sortOrderKey,
    }),
    [pageKey, sizeKey, sortByKey, sortOrderKey],
  );

  // URL state management
  const [urlState, setUrlState] = useQueryStates(parsers, {
    urlKeys: urlKeyMap,
  });

  // Local state fallback when URL keys are disabled
  const [localState, setLocalState] = useState(() => ({
    page: defaultPageIndex + 1,
    size: defaultPageSize,
    sortBy: null as string | null,
    sortOrder: null as string | null,
  }));

  const state = disableUrlKeys ? localState : urlState;

  // Unified setState function that works with both URL and local state
  const setState = useCallback(
    (updates: Partial<typeof state>) => {
      if (disableUrlKeys) {
        setLocalState((prev) => ({ ...prev, ...updates }));
      } else {
        setUrlState(updates);
      }
    },
    [disableUrlKeys, setUrlState],
  );

  // Convert URL state (1-based page) to PaginationState (0-based pageIndex)
  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: (state.page ?? defaultPageIndex + 1) - 1, // Convert 1-based to 0-based
      pageSize: state.size ?? defaultPageSize,
    }),
    [state.page, state.size, defaultPageIndex, defaultPageSize],
  );

  // Convert URL state to SortingState
  const sorting = useMemo<SortingState>(() => {
    const sortBy = state.sortBy;
    const sortOrder = state.sortOrder;

    if (!sortBy) {
      return [];
    }

    return [
      {
        id: sortBy,
        desc: sortOrder === "desc",
      },
    ];
  }, [state.sortBy, state.sortOrder]);

  // Set pagination handler
  const setPagination: (
    updater: PaginationState | ((prev: PaginationState) => PaginationState),
  ) => void = useCallback(
    (updater) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;

      setState({
        page: newPagination.pageIndex + 1, // Convert 0-based to 1-based
        size: newPagination.pageSize,
      });
    },
    [pagination, setState],
  );

  // Set sorting handler
  const setSorting: (
    updater: SortingState | ((prev: SortingState) => SortingState),
  ) => void = useCallback(
    (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;

      if (newSorting.length === 0) {
        setState({
          sortBy: null,
          sortOrder: null,
        });
      } else {
        const firstSort = newSorting[0];
        setState({
          sortBy: firstSort.id,
          sortOrder: firstSort.desc ? "desc" : "asc",
        });
      }
    },
    [sorting, setState],
  );

  return {
    openCreateSheet,
    setOpenCreateSheet,
    pagination,
    setPagination,
    sorting,
    setSorting,
  };
};
