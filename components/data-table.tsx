import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    OnChangeFn,
    PaginationState,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "./ui/button";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

type Props<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data?: {
        items: TData[];
        count: number;
    };
    pagination: PaginationState;
    setPagination: OnChangeFn<PaginationState>;
};

export const DataTable = <TData, TValue>({
    columns,
    data,
    pagination,
    setPagination,
}: Props<TData, TValue>) => {
    const tc = useTranslations("Common");

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: data?.items ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),

        manualPagination: true,
        rowCount: data?.count,
        state: {
            pagination,
        },
        onPaginationChange: setPagination,
    });

    return (
        <div className="flex flex-col gap-8">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => {
                        return (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <TableHead key={header.id}>
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
                        );
                    })}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map(row => {
                            return (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map(cell => {
                                        return (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })
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

            {/* Pagination */}
            <div className="flex items-center gap-2 justify-end">
                <Button
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                    variant="ghost"
                    size="icon"
                >
                    <ArrowLeftIcon />
                </Button>
                <span>
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                </span>
                <Button
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                    variant="ghost"
                    size="icon"
                >
                    <ArrowRightIcon />
                </Button>
            </div>
        </div>
    );
};
