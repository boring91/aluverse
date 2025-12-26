import { useQueryStates, parseAsString, parseAsIsoDateTime } from "nuqs";
import { useCallback, useMemo } from "react";

type FilterControl<T> = {
    value: T | null;
    set: (value: T | null) => void;
};

// Parser definitions for different filter types
const filterParsers = {
    dateRange: {
        from: parseAsIsoDateTime,
        to: parseAsIsoDateTime,
    },
    isConsolidated: parseAsString,
};

type DateRange = {
    from?: Date;
    to?: Date;
};

type BooleanFilterValue = "true" | "false" | "all" | undefined;

export type TransactionFilterValues = {
    dateRange: DateRange;
    isConsolidated: BooleanFilterValue;
};

export type TransactionFilterSetters = {
    setDateRange: (value: DateRange) => void;
    setIsConsolidated: (value: BooleanFilterValue) => void;
    resetFilters: () => void;
};

export const useTransactionFilters = () => {
    const [dateRangeState, setDateRangeState] = useQueryStates(
        filterParsers.dateRange,
        {
            urlKeys: {
                from: "from",
                to: "to",
            },
        }
    );

    const [isConsolidatedState, setIsConsolidatedState] = useQueryStates(
        {
            isConsolidated: filterParsers.isConsolidated,
        },
        {
            urlKeys: {
                isConsolidated: "consolidated",
            },
        }
    );

    const dateRange: DateRange = useMemo(
        () => ({
            from: dateRangeState.from ?? undefined,
            to: dateRangeState.to ?? undefined,
        }),
        [dateRangeState.from, dateRangeState.to]
    );

    const isConsolidated = (isConsolidatedState.isConsolidated ??
        undefined) as BooleanFilterValue;

    const setDateRange = useCallback(
        (value: DateRange) => {
            setDateRangeState({
                from: value.from ?? null,
                to: value.to ?? null,
            });
        },
        [setDateRangeState]
    );

    const setIsConsolidated = useCallback(
        (value: BooleanFilterValue) => {
            setIsConsolidatedState({
                isConsolidated: value === "all" ? null : value ?? null,
            });
        },
        [setIsConsolidatedState]
    );

    const reset = useCallback(() => {
        setDateRangeState({ from: null, to: null });
        setIsConsolidatedState({ isConsolidated: null });
    }, [setDateRangeState, setIsConsolidatedState]);

    const filter = useMemo(() => {
        return {
            dateRange: { value: dateRange, set: setDateRange },
            isConsolidated: { value: isConsolidated, set: setIsConsolidated },
        };
    }, [dateRange, isConsolidated, setDateRange, setIsConsolidated]);

    const isActive = useMemo(() => {
        return (
            !!dateRange.from || !!dateRange.to || isConsolidated !== undefined
        );
    }, [dateRange.from, dateRange.to, isConsolidated]);

    return {
        filter,
        reset,
        isActive,
    };
};
