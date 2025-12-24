import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    OnChangeFn,
    PaginationState,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { PageLoader } from "@/components/page-loader";

type Props<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data?: {
        items: TData[];
        count: number;
    };
    pagination: PaginationState;
    setPagination: OnChangeFn<PaginationState>;
    sorting?: SortingState;
    setSorting?: OnChangeFn<SortingState>;
    columnFilters?: ColumnFiltersState;
    setColumnFilters?: OnChangeFn<ColumnFiltersState>;
    columnVisibility?: VisibilityState;
    setColumnVisibility?: OnChangeFn<VisibilityState>;
    setOpenCreateSheet?: (open: boolean) => void;
};

export const DataTable = <TData, TValue>({
    columns,
    data,
    pagination,
    setPagination,
    sorting: controlledSorting,
    setSorting: setControlledSorting,
    columnFilters: controlledColumnFilters,
    setColumnFilters: setControlledColumnFilters,
    columnVisibility: controlledColumnVisibility,
    setColumnVisibility: setControlledColumnVisibility,
    setOpenCreateSheet,
}: Props<TData, TValue>) => {
    const tc = useTranslations("Common");

    // Internal state fallback
    const [internalSorting, setInternalSorting] = useState<SortingState>([]);
    const [internalColumnFilters, setInternalColumnFilters] =
        useState<ColumnFiltersState>([]);
    const [internalColumnVisibility, setInternalColumnVisibility] =
        useState<VisibilityState>({});

    const sorting = controlledSorting ?? internalSorting;
    const setSorting = setControlledSorting ?? setInternalSorting;
    const columnFilters = controlledColumnFilters ?? internalColumnFilters;
    const setColumnFilters =
        setControlledColumnFilters ?? setInternalColumnFilters;
    const columnVisibility =
        controlledColumnVisibility ?? internalColumnVisibility;
    const setColumnVisibility =
        setControlledColumnVisibility ?? setInternalColumnVisibility;

    const isServerSide =
        !!controlledSorting ||
        !!controlledColumnFilters ||
        !!setControlledSorting;

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: data?.items ?? [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        manualPagination: true,
        manualSorting: isServerSide,
        manualFiltering: isServerSide,
        rowCount: data?.count,
        onPaginationChange: setPagination,
    });

    return (
        <div className="flex flex-col gap-4">
            <DataTableToolbar
                table={table}
                setOpenCreateSheet={setOpenCreateSheet}
            />
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {!data ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    <PageLoader variant="inline" />
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    {tc("noResults")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    );
};
