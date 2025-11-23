"use client";

import { Table } from "@tanstack/react-table";

import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
    searchKey?: string;
}

export function DataTableToolbar<TData>({
    table,
}: DataTableToolbarProps<TData>) {
    return (
        <div className="flex items-center justify-between">
            <div>{/* Filters will be here */}</div>
            <DataTableViewOptions table={table} />
        </div>
    );
}
