import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  SortingState,
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
import { useState } from "react";
import type { ReactNode } from "react";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { PageLoader } from "@/components/page-loader";

type Props<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data?: {
    items: TData[];
    count: number;
    filteredCount: number;
  };
  pagination: PaginationState;
  setPagination: OnChangeFn<PaginationState>;
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  columnVisibility?: VisibilityState;
  setColumnVisibility?: OnChangeFn<VisibilityState>;
  setOpenCreateSheet?: (open: boolean) => void;
  filtersSlot?: ReactNode;
};

export const DataTable = <TData, TValue>({
  columns,
  data,
  pagination,
  setPagination,
  sorting: controlledSorting,
  setSorting: setControlledSorting,
  columnVisibility: controlledColumnVisibility,
  setColumnVisibility: setControlledColumnVisibility,
  setOpenCreateSheet,
  filtersSlot,
}: Props<TData, TValue>) => {
  // Internal state fallback
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});

  const sorting = controlledSorting ?? internalSorting;
  const setSorting = setControlledSorting ?? setInternalSorting;
  const columnVisibility =
    controlledColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility =
    setControlledColumnVisibility ?? setInternalColumnVisibility;

  const isServerSide = !!controlledSorting || !!setControlledSorting;

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: {
      pagination,
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    manualSorting: isServerSide,
    rowCount: data?.filteredCount,
    onPaginationChange: setPagination,
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      <DataTableToolbar table={table} setOpenCreateSheet={setOpenCreateSheet} />
      {filtersSlot && <div>{filtersSlot}</div>}
      <div className="border h-full overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
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
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        count={data?.count}
        filteredCount={data?.filteredCount}
      />
    </div>
  );
};
