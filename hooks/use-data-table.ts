import {
    ColumnFiltersState,
    PaginationState,
    SortingState,
} from "@tanstack/react-table";
import { useState } from "react";

type Props = {
    pageIndex?: number;
    pageSize?: number;
};

export const useDataTable = ({ pageIndex = 0, pageSize = 20 }: Props = {}) => {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex,
        pageSize,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    return {
        pagination,
        setPagination,
        sorting,
        setSorting,
        columnFilters,
        setColumnFilters,
    };
};
